# 🛡️ ECC Agent Workflow Rules (RULES.md)

Este archivo define las reglas de desarrollo y hooks de sistema inspirados en **affaan-m/ECC** para asegurar la calidad de código, triaje y control del arnés del agente.

## 📌 Flujo de Trabajo (Harness Workflow)

1. **Investigación y Contexto Primero:**
   - Queda prohibido modificar código sin antes listar el mapa técnico local en `.agent/MAP.md`.
   - Si no existe el archivo `.agent/STATE.md`, se debe invocar la inicialización automática del proyecto (`npm run init-project`).
   - Se debe leer y verificar la existencia de un contrato de especificación en `.agent/SPECS.md` antes de realizar cambios de código (OpenSpec).

2. **Garantía de Calidad y Ciclo de Desarrollo (Superpowers):**
   - Todo cambio de código debe realizarse en pasos atómicos. No se permiten refactorizaciones o adiciones masivas sin verificación intermedia.
   - Escribir pruebas unitarias/integración antes o durante la codificación (TDD) para validar comportamientos esperados y casos de borde.
   - Pasar por la puerta de verificación (Verificaton Gate) confirmando que los tests pasan y que no hay regresiones.

3. **Higiene de Contexto y Token Saving:**
   - Al ejecutar comandos o búsquedas, limita el output y la cantidad de líneas devueltas (ej. `head -n 20`).
   - Evita lecturas completas de archivos binarios o bases de datos sin filtros.

4. **Caché de Respuestas y Memoria:**
   - Integración nativa con Valkey. La lógica de control debe verificar la caché semántica local en Valkey (`6379`) antes de enviar consultas redundantes al modelo.

5. **Soberanía y Seguridad de Datos:**
   - Ninguna credencial, token (PAT) o credencial de base de datos puede ser subida a repositorios públicos o expuesta en logs.
   - Las carpetas `./data` y los archivos `.env` deben estar permanentemente en el `.gitignore`.

## 📌 Estándares de desarrollo obligatorios (todo lenguaje y todo proyecto)

6. **Código real desde el primer commit:** sin datos simulados, maquetas, `TODO` ni funciones vacías en el código de la aplicación; los
   mocks solo en pruebas (`rules/common/honesty.md` §1.1, skill `reglas-globales`).
7. **Documentación:** código (Javadoc/TSDoc/docstrings en API pública), contrato **OpenAPI/Swagger** en toda API HTTP, `COMMENT ON` en la
   base de datos, README por módulo y ADR por decisión (`rules/common/documentation.md`).
8. **Seguridad:** secretos fuera del código, autorización en cada endpoint, validación de entrada, errores sin fuga y cero hallazgos
   nuevos del escáner por cambio (`rules/common/security.md`, `rules/<lenguaje>/`).
9. **Base de datos:** migraciones versionadas e idempotentes, PK `uuidv7()`, columnas y triggers de auditoría (skills
   `database-liquibase-postgresql`, `postgres-audit`; `rules/common/database-style.md`).
10. **Por lenguaje:** Java/Spring Boot (`rules/java/`, skills `backend-*`), Angular/TypeScript (`rules/angular/`, `rules/typescript/`,
    skills `generacion-*`, `frontend-*`), Python (`rules/python/`), PostgreSQL (`rules/postgres/`, skills `database-liquibase-postgresql`, `postgres-audit`). Pruebas con caso positivo y negativo (`rules/common/testing.md`).
11. **Cumplimiento CMMI V3.0 / ISO 27001:** el trabajo produce la evidencia (requisito trazable, MR revisado por otra persona, CI en verde,
    tags, migraciones, ADR); lo no medible se declara `NO EVALUADO` (`rules/common/compliance.md`, skill `cumplimiento-cmmi-iso`).
12. **Reglas de negocio:** cada módulo con su catálogo de reglas (origen explícita/inferida/propuesta; solo las explícitas son requisito), implementadas en el servidor y con prueba (`rules/common/business-rules.md`, skill `backend-integridad-negocio`).
13. **Proceso de entrega:** requerimientos con sus seis campos, diseño de errores y alternos, pruebas con el usuario de cada actor y tickets de soporte clasificados (un servicio sin cambio no toca código, configuración, datos ni despliegue) (`rules/common/delivery-process.md`).
14. **Antes de entregar:** pruebas, verificadores y escáner ejecutados con su salida real (skill `verification-before-completion`).
