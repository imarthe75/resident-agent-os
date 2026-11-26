---
name: secure-forensic-audit
description: "Directivas para implementar en Spring Boot (Java 21) un subsistema de evidencia forense de acciones de negocio: cifrado AES-GCM, cadena de hashes, firmas HMAC y resiliencia ante caídas. Úsala cuando un sistema deba demostrar quién hizo qué y que la bitácora no se alteró (firmas, expedientes, trámites con valor legal). No sustituye la auditoría de cambios de datos de postgres-audit."
---

# Skill: Auditoría Segura y Evidencia Forense (AI Agent Skill)

Este skill define las directrices y reglas obligatorias para que un Agente de IA diseñe e implemente el subsistema de **Auditoría Segura y Evidencia Forense** en arquitecturas Spring Boot, garantizando trazabilidad inalterable de nivel bancario.

## 0. Alcance frente a la auditoría de base de datos (obligatorio leer)
- La auditoría de **cambios de datos** (INSERT/UPDATE/DELETE/TRUNCATE/DDL) la da **siempre** el estándar de auditoría de la base
  de datos (`postgres-audit`). Esta skill **no la sustituye ni la reimplementa**: no crear bitácoras DML propias ni otra cadena de hashes en tablas.
- Esta skill cubre otra capa: **eventos de negocio** (quién aprobó, consultó, descargó, firmó) y, solo cuando el proyecto lo exige por
  regulación, **evidencia forense en archivo** fuera de la base.
- Las tablas de eventos de negocio que cree el proyecto siguen `database-liquibase-postgresql` (columnas canónicas y triggers de auditoría de `postgres-audit`).
- Llaves de cifrado y HMAC solo desde un gestor de secretos (Vault); nunca en propiedades ni en el código (`reglas-globales`).

## 1. Directrices de Arquitectura
*   **Persistencia Dual Paralela**: Todos los eventos de auditoría crítica deben guardarse en paralelo:
    1.  **Base de Datos Relacional (PostgreSQL)**: Tablas particionadas mensualmente con datos planos (JSONB para metadatos) para búsquedas y consultas operacionales rápidas del frontend.
    2.  **Archivo Binario Seguro (Disco/NFS)**: Bloques inalterables cifrados y encadenados secuencialmente para evidencia forense regulada.
*   **Aislamiento Total de I/O**:
    *   La persistencia de auditoría NUNCA debe bloquear el hilo principal de la petición de negocio.
    *   Debe ejecutarse en un hilo de fondo asíncrono asignado a un Executor dedicado de Hilos Virtuales de Java 21 (`auditExecutor` con `Executors.newVirtualThreadPerTaskExecutor()`).
    *   La persistencia en base de datos y el flujo de archivado forense deben ejecutarse en hilos virtuales paralelos para no afectarse mutuamente.

## 2. Directivas de Integridad Criptográfica (Evidencia Binaria)
*   **CBOR (Concise Binary Object Representation)**: El payload de auditoría debe serializarse en formato estructurado binario CBOR usando Jackson, e incluir metadatos del entorno (`server_instance_id` de observabilidad del nodo y `application_version`).
*   **Cifrado Fuerte**: Cifrado obligatorio con **AES-256-GCM** (con vectores de inicialización (IV) de 12 bytes autogenerados y tag de autenticación de 128 bits).
*   **Hash Chain (SHA-256)**: Cada log debe encadenarse matemáticamente al bloque anterior para impedir inserción, borrado o reordenación de logs:
    $$\text{hashActual} = \text{SHA-256}(\text{hashAnterior} + \text{payloadEncriptado} + \text{timestamp})$$
*   **Firma HMAC-SHA256 Envolvente**: Aplica una firma HMAC-SHA256 sobre el frame binario completo (Magic Bytes + Version + Suite + Frame Length + Timestamp + IV + Hash Anterior + Hash Actual + Payload Cifrado) antes de guardarlo en disco para impedir la alteración física de metadatos estructurales externos.
*   **Resiliencia Física (CRC32)**: Agrega un checksum CRC32 al final de cada frame para descartar corrupción de sectores de disco antes de iniciar la validación criptográfica.

## 3. Directivas del Escritor de Archivos (Single-Writer Thread Pattern)
*   **LinkedBlockingQueue**: El servicio de archivos asíncrono no debe escribir directamente en disco de manera síncrona. Debe encolar los frames en una cola de memoria acotada (ej. `LinkedBlockingQueue` de 50,000 elementos) para evitar fugas de memoria (`OutOfMemoryError`) si el disco se congela.
*   **Single-Writer Dedicated Thread**: Arranca un hilo dedicado de segundo plano que procese secuencialmente la cola y realice escrituras físicas consecutivas por `FileOutputStream`, evitando colisiones e inconsistencias de escritura concurrente.
*   **Rotación Dinámica**: El escritor de archivos debe rotar dinámicamente el archivo de evidencias en base a:
    1.  **Fecha**: Rotación diaria al cambiar la fecha UTC.
    2.  **Tamaño**: Rotación cuando el archivo actual excede el límite (ej. 100MB).
*   **Cierre Controlado (`@PreDestroy`)**: Al apagar la aplicación, se debe drenar de forma segura la cola en memoria, realizar flush físico en disco, cerrar streams y empaquetar los archivos de log cerrados en formato **GZIP** asíncronamente.
*   **Aislamiento POSIX**: Para sistemas operativos tipo UNIX/Linux, el proveedor de almacenamiento debe forzar permisos de directorio **700 (chmod 700: rwx------)** para evitar la lectura de otros usuarios del sistema operativo.

## 4. Resiliencia de Fallas y Reintegración NIO
*   **Mecanismo de Fallback Híbrido**: Si la base de datos de auditoría se desconecta:
    1.  Los logs deben retenerse temporalmente en la cola de memoria.
    2.  Si la cola se llena, deben guardarse preventivamente en un archivo de texto de fallback (`audit-fallback.log`) limitado a 50MB en disco.
*   **Scheduler de Reintegración**: Un scheduler dinámico debe ejecutarse de forma ágil (cada 30 seg) para:
    1.  Drenar y persistir la cola de memoria en la base de datos cuando se restablezca la conexión.
    2.  Adquirir un bloqueo exclusivo de archivo NIO (`FileChannel.tryLock()` sobre un archivo `.lock`) para procesar el disco de fallback. Esto previene que múltiples instancias de réplicas en Kubernetes procesen o dupliquen el mismo archivo al mismo tiempo.

## Documentación obligatoria (en el mismo cambio)
- Cada controlador con `@Tag`; cada endpoint con `@Operation(summary, description)` y `@ApiResponses` que incluyan la respuesta 2xx y las de error que puede devolver (400, 401, 403, 404, 409) con ejemplo; `@Schema` en los DTO con descripción y ejemplo de cada campo.
- Javadoc en clases y métodos públicos de servicio: qué hace, reglas de negocio, parámetros, retorno y excepciones con su código HTTP.
- El contrato OpenAPI que genera springdoc se versiona junto al código y coincide con el endpoint real.
- Plantillas y ejemplos: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`AUDIT-LOG-MUTATION-ENDPOINT`, `STD-STRIDE-MISSING-AUDIT-LOG`, `WEAK-CRYPTOGRAPHY`, `CRYPTO-CBC-NO-AUTHENTICATION`, `TIMING-UNSAFE-SECRET-COMPARISON`, `STD-STRIDE-LOG-SENSITIVE-DATA`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
