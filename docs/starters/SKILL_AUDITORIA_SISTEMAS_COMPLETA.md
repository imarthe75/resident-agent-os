# 🔍 SKILL: AUDITORÍA TÉCNICA INTEGRAL DE SISTEMAS (VERSIÓN AMPLIADA)
## Metodología Completa para Evaluación de Seguridad, Performance, DevOps, Testing & Desarrollo

**Versión:** 3.0  
**Fecha:** 2026-07-13  
**Alcance:** Tecnología agnóstica (cualquier stack)  
**Audiencia:** Arquitectos, QA, Security Engineers, DevOps  
**Objetivo:** Detectar y documentar hallazgos de forma estructurada y procesable

---

## 📋 TABLA DE CONTENIDOS

1. [Fase 0: Preparación & Contexto](#fase-0-preparación--contexto)
2. [Fase 1: Detección Sistemática](#fase-1-metodología-de-detección)
3. [Fase 2: Documentación de Hallazgos](#fase-2-plantilla-del-reporte)
4. [Fase 3: Priorización & Risk Matrix](#fase-3-matriz-de-priorización)
5. [Fase 4: Standards Compliance Checklist](#fase-4-compliance--estándares-internacionales)
6. [Apéndice: Herramientas & Scripts](#apéndice-herramientas--scripts)

---

# FASE 0: PREPARACIÓN & CONTEXTO

## 0.1 Recopilar Información del Sistema

Antes de auditar, documental:

| Aspecto | Preguntas | Evidencia |
|---------|-----------|----------|
| **Stack Tecnológico** | ¿Lenguaje backend? ¿Framework? ¿DB? ¿Frontend?| package.json, pom.xml, requirements.txt, docker-compose.yml |
| **Usuarios & Volumen** | ¿Cuántos usuarios activos? ¿Transacciones/segundo? ¿Data en TB? | Métricas de producción, logs de APM |
| **Criticidad** | ¿Sistema de producción? ¿Maneja datos sensibles? ¿PII? | RACI, SLAs, categorización de datos |
| **Normativa** | ¿GDPR? ¿HIPAA? ¿SOC2? ¿ISO27001? | Documentación de compliance, auditorías previas |
| **Arquitectura** | ¿Monolítico? ¿Microservicios? ¿Serverless? | Diagrama de arquitectura, desenrollamiento de infraestructura |

---

# FASE 1: METODOLOGÍA DE DETECCIÓN (CÓMO BUSCAR)

## 🗄️ Capa 1: Base de Datos y Persistencia

### 1.1 Problema N+1 (Lazy Loading)

| Método | Herramienta | Evidencia |
|--------|-------------|-----------|
| **Logs de SQL** | MySQL slow query log, Postgres logs, MongoDB profiler | Secuencias repetitivas: `SELECT FROM tabla WHERE id=1`, `SELECT FROM tabla WHERE id=2`... |
| **APM / Tracing** | New Relic, DataDog, Jaeger, OpenTelemetry | Waterfall mostrando múltiples queries en serie para una sola acción |
| **Análisis de código** | IDE inspection, SonarQube | Relaciones ORM marcadas `lazy` accedidas fuera de contexto transaccional |

**Severidad por Volumen:**
- 1-10 queries adicionales: Media
- 11-100: Alta
- 100+: Crítica

---

### 1.2 Índices Faltantes

| Método | Comando/Herramienta | Evidencia |
|--------|-----------|-----------|
| **SQL** | `EXPLAIN ANALYZE` (Postgres), `EXPLAIN` (MySQL) | Tipo `Seq Scan` en tablas >10K filas, `index_type: ALL` en MySQL |
| **NoSQL** | `.explain("executionStats")` (MongoDB) | `executionStages.stage: COLLSCAN` en colecciones grandes |
| **Vistas de Sistema** | `pg_stat_user_tables`, `sys.schema_redundant_indexes`, `information_schema` | Mean execution time >50ms para queries de búsqueda simple |

**Criterios:**
- Índice faltante en FK (relaciones): **Crítica**
- Índice faltante en campo de búsqueda frecuente (nombre, email): **Alta**
- Índice faltante en filtro ocasional: **Media**

---

### 1.3 Carga Perezosa Insegura (Lazy Loading Outside Transaction)

| Método | Detección | Síntoma |
|--------|-----------|---------|
| **Inspección ORM** | Buscar `@OneToMany(fetch=LAZY)`, `@ManyToOne(fetch=LAZY)` | Atributos lazy accedidos fuera de `@Transactional` |
| **Excepciones** | Monitorear logs | `LazyInitializationException`, `DetachedEntityException` |
| **Test de Integración** | Simular acceso fuera de contexto | Fallos en acceso a relaciones post-cierre de sesión |

---

### 1.4 Operaciones Iterativas (No-Batch)

| Método | Búsqueda | Problematico |
|--------|----------|--------------|
| **Inspección de código** | Grep: `for.*in.*while` dentro de `repo.save()` | Bucles con `.save()` individual vs `.saveAll()` |
| **Inspección de propiedades** | Buscar propiedades de Hibernate en `application.properties`/`yml` | Ausencia de `spring.jpa.properties.hibernate.jdbc.batch_size` |
| **Profiler de DB** | Monitoreo de statements ejecutados | INSERT/UPDATE ejecutados N veces vs 1 batch |
| **Load test** | JMeter, Locust, Artillery | Picos de queries que crecen linealmente con N |

**Recomendación:**
- batch_size ≥ 20 para operaciones masivas, habilitando `order_inserts` y `order_updates` en properties.
- Timeout: si >1000 items, usar batch

---

### 1.5 Saturación de Conexiones (Connection Pool Exhaustion)

| Método | Indicador | Umbral Crítico |
|--------|-----------|----------------|
| **Logs de Pool** | HikariCP, SQLAlchemy, Spring Data | `ConnectionTimeoutException` o `FATAL: query_wait_timeout` (PgBouncer) |
| **Métricas DB** | `pg_stat_activity`, `SHOW processlist` (MySQL) | Active connections >= max_connections × 0.9 |
| **Métricas Proxy** | PgBouncer Console (`SHOW POOLS`) | `cl_waiting` > 0 (Clientes bloqueados esperando conexión) |
| **APM** | New Relic, Datadog | Latency pico cuando pool se satura |

**Diagnóstico Rápido en PostgreSQL / PgBouncer:**
1. *Ver consultas activas que bloquean el pool:*
   ```sql
   SELECT pid, usename, client_addr, state, query, age(clock_timestamp(), query_start) 
   FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start ASC;
   ```
2. *Terminar conexión problemática:*
   ```sql
   SELECT pg_terminate_backend(pid);
   ```
3. *Verificar colas en PgBouncer Admin:*
   ```bash
   psql -h localhost -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
   ```

**Fórmula de Ajuste:**
- `maximum-pool-size` (HikariCP) debe ser consistente con el `pool_size` de PgBouncer.
- Evitar transacciones innecesariamente largas en Spring (ej. llamadas a APIs externas dentro de métodos `@Transactional`).

---

### 1.6 Condiciones de Carrera (Lost Updates, Race Conditions)

| Método | Detección | Prueba |
|--------|-----------|--------|
| **Inspección Schema** | Buscar `row_version`, `@Version`, timestamp de actualización | Falta de columna de control de versiones |
| **Locks** | `SELECT FOR UPDATE`, `LOCK IN SHARE MODE` | Ausencia de bloqueos en transacciones críticas |
| **Test Concurrente** | Apache JMeter, Gatling | 2+ peticiones simultáneas sobre el mismo recurso → último usuario gana |

---

### 1.7 Secretos en BD (Credentials Storage)

| Método | Búsqueda | Crítica |
|--------|----------|---------|
| **Inspección de Schema** | Columnas con nombre `password`, `secret`, `token` | Cifrado reversible (AES) en lugar de hash (bcrypt, Argon2) |
| **Datos reales** | Muestreo aleatorio de registros | Contraseñas en texto plano |
| **Backup** | Revisar archivos SQL de respaldo | Exposición de credenciales en backups |

---

## 🌐 Capa 2: Backend API

### 2.1 Listados sin Límite (Pagination)

| Método | Detección | Problema |
|--------|-----------|----------|
| **Inspección rutas** | Buscar endpoints que retornan `[]` | Parámetros `page`, `limit`, `offset` ausentes |
| **Test manual** | GET `/api/users` sin parámetros | Respuesta contiene 3,483 usuarios × 5KB = 17.4MB |
| **Payload analysis** | DevTools Network tab | Transfer size >10MB para una sola request |

**Límite seguro:** Max 500 items/página

---

### 2.2 Consultas Redundantes (Sin Caché)

| Método | Herramienta | Evidencia |
|--------|-------------|-----------|
| **Profiler DB** | New Relic APM query analytics | Misma query ejecutada 1000+ veces/día (catálogos estáticos) |
| **Redis/Memcached** | Monitoreo de hit rate | Hit rate <80% en datos que cambian <1x/día |
| **Logs de DB** | Slow query logs | Queries de lectura ejecutadas repetitivamente en loops cortos |

**Regla:** Si query se ejecuta >10x/día y datos no cambian, debe estar en caché

---

### 2.3 Datos en Tránsito Pesados (Sin Compresión)

| Método | Verificación | Falla |
|--------|--------------|-------|
| **DevTools Network** | Pestaña Network, Filter: XHR | Size > Transfer (indica no hay gzip) |
| **Headers** | `curl -I https://api.example.com/endpoint` | Sin `Content-Encoding: gzip` o `br` |
| **Benchmark** | `ab -n 100 -c 10 https://api/users` | Response time x2-x3 sin gzip |

**Métrica:** gzip debe reducir JSON al 20% del original

---

### 2.4 Construcción Dinámica de SQL (SQL Injection)

| Método | Búsqueda | Ejemplo Vulnerable |
|--------|----------|-------------------|
| **Análisis estático** | SAST: SonarQube, Semgrep, Checkmarx | `query = "SELECT * FROM users WHERE name = '" + input + "'"` |
| **Prueba negativa** | Enviar payload: `'; DROP TABLE users; --` | Éxito indica SQL injection |
| **Logs** | Monitorear errores SQL | Sintaxis inválida indica intento de inyección |

**Esperado:** Query parametrizado: `repo.findByName(?)` o `@Query("... WHERE name = ?1")`

---

### 2.5 Desaprovechamiento de Caché HTTP (ETags, Cache-Control)

| Método | Comando | Esperado |
|--------|---------|----------|
| **Headers** | `curl -I https://api.example.com/data` | `Cache-Control: max-age=3600` |
| **ETag** | Segunda request con `If-None-Match` | Respuesta `304 Not Modified` |
| **DevTools** | Network tab, reload página | Recursos cached en disco/memoria |

---

### 2.6 Rate Limiting Ausente

| Método | Test | Falla |
|--------|------|-------|
| **Script** | Enviar 1000 requests/segundo | Respuesta `200 OK` en todas (sin `429 Too Many Requests`) |
| **Herramienta** | Apache Bench: `ab -n 10000 -c 100` | Servidor responde sin protección |
| **Config** | Revisar middleware/gateway | Ausencia de `@RateLimit`, `@Throttle` |

---

### 2.7 Errores Exponiendo Detalles Internos

| Método | Test | Vulnerable |
|--------|------|-----------|
| **Enviar payload malformado** | `GET /api/users/invalid-uuid` | Stack trace completo en respuesta 500 |
| **Inspeccionar errores** | JSON response con `stack`, `file`, `line` | Expone rutas internas `/home/app/backend/...` |
| **Monitoreo** | Logs de error público | Nombres de tabla, estructura de BD visible |

**Esperado:** Error genérico: `{"error": "Invalid request"}` (sin detalles internos)

---

## 🎨 Capa 3: Frontend UI

### 3.1 Ciclos de Renderizado Excesivos (Inefficient Re-renders)

| Framework | Herramienta | Síntoma |
|-----------|-------------|---------|
| **React** | React DevTools Profiler | Componente re-renderiza 10+ veces en 1 segundo |
| **Angular** | Angular DevTools, `OnPush` checker | Default `ChangeDetectionStrategy` en lista de 100+ items |
| **Vue** | Vue DevTools, Performance tab | Update lifecycle triggered por cada keystroke |

**Métrica:** <100ms por render completo

---

### 3.2 Suscripciones Huérfanas (Memory Leaks)

| Método | Búsqueda | Síntoma |
|--------|----------|---------|
| **Código** | Grep: `subscribe()` sin `unsubscribe()` o `takeUntil` | Suscripción activa tras destruir componente |
| **DevTools Memory** | Heap snapshot comparativo | Memory sigue creciendo tras navegar entre rutas |
| **Performance** | Monitorar 10+ navegaciones | Memory aumenta 5MB/navegación |

**Regla:** Todo `.subscribe()` debe tener cleanup con `ngOnDestroy` o `takeUntil`

---

### 3.3 Fugas de Memoria (Memory Profiling)

| Herramienta | Método | Evidencia |
|-------------|--------|-----------|
| **DevTools Memory** | Snapshot inicial → acciones → snapshot final | Diferencia >10MB tras navegaciones repetidas |
| **Performance Monitor** | Chrome DevTools > Rendering (frame rate, memory) | Memory grows without limits |
| **Lighthouse** | "Web Vitals" | LCP, CLS affected by memory bloat |

---

## 🔐 Capa 4: Seguridad (Security Checklist)

### 4.1 IDOR (Insecure Direct Object Reference)

| Test | Método | Vulnerabilidad |
|------|--------|-----------------|
| **Cambiar ID en URL** | GET `/api/users/123` → GET `/api/users/124` | Acceso a otro usuario sin error 403 |
| **Token de otro usuario** | Usar token de usuario B para acceder recurso de A | Éxito en consulta/modificación |
| **GraphQL** | Query sobre objeto no autorizado | Sin validación de permisos |

---

### 4.2 Autenticación Débil

| Vulnerabilidad | Detección | Síntoma |
|----------------|-----------|---------|
| **Fuerza bruta** | Enviar 1000 intentos de login | Sin `429 Too Many Requests`, sin bloqueo de cuenta |
| **Contraseña débil** | Aceptar `password=123` | Sin requisitos de complejidad |
| **Session fixation** | Reusar sessionId antes de login | Acceso sin re-autenticar |
| **JWT expiración** | JWT token sin exp claim | Token válido indefinidamente |

---

### 4.3 Falta de Headers de Seguridad

| Header | Verificación | Esperado |
|--------|--------------|----------|
| **Strict-Transport-Security** | `curl -I https://...` o inspección de `nginx.conf`/`web.config` | `Strict-Transport-Security: max-age=31536000` |
| **X-Frame-Options** | Verificar header en server/Nginx config | `X-Frame-Options: DENY` o `SAMEORIGIN` |
| **X-Content-Type-Options** | Verificar header en server/Nginx config | `X-Content-Type-Options: nosniff` |
| **Content-Security-Policy** | Verificar header en server/Nginx config | `Content-Security-Policy: default-src 'self'` |
| **Referrer-Policy** | Verificar header en server/Nginx config | `Referrer-Policy: strict-origin-when-cross-origin` |

---

### 4.4 Exposición de PII (Personally Identifiable Information)

| Dato | Verificación | Vulnerable |
|------|--------------|-----------|
| **Contraseñas** | SELECT password FROM users | Texto plano (no hashed) |
| **Email** | Query sin filtros | Enumerable (tieneEmail@domain.com valida o no) |
| **Identificación** | Documento visible en listados | Último 4 dígitos al menos debe ocultarse |
| **Teléfono** | En response JSON | Visible en texto plano |

---

### 4.5 Vulnerabilidades en Dependencias

| Herramienta | Comando | Acción |
|-------------|---------|--------|
| **npm** | `npm audit` | Reporta vulnerabilidades críticas/altas |
| **pip** | `pip-audit` | Identifica paquetes Python vulnerables |
| **maven** | `mvn dependency-check:check` | Escanea dependencias Java |
| **composer** | `composer audit` | Revisa paquetes PHP |

---

## ⚙️ Capa 5: Infraestructura & DevOps

### 5.1 Configuración de Base de Datos y Backups
- **WAL Habilitado:** Garantizar que los logs de transacción se escriben antes de persistir cambios.
- **Políticas de Backup:** Validar automatización de respaldos e integridad de datos periódica.
- **Principio de Mínimo Privilegio:** Restringir sentencias `GRANT` para usuarios de aplicaciones.

### 5.2 Dockers y Contenedores (Estándares OCI)
- **Imagen Base Ligera:** Usar Alpine o distroless.
- **Proceso Non-Root:** No ejecutar procesos dentro del contenedor como usuario `root`.

### 5.3 CI/CD y Automatización
- **Secrets Management:** Inyección segura mediante Vault o AWS Secrets Manager en lugar de variables hardcodeadas en pipelines.
- **Quality Gates:** Establecer SonarQube o Checkmarx obligatorios en cada PR.

---

# FASE 2: PLANTILLA DEL REPORTE DE HALLAZGOS

## Formato Estándar para Documentar Cada Hallazgo

### [ID-XYZ] [Nombre Corto, máx 8 palabras]

**Severidad:** `[🔴 Crítica | 🟠 Alta | 🟡 Media | 🟢 Baja]`  
**Categoría:** `[Seguridad | Rendimiento | Lógica | Mantenibilidad]`  
**Componente:** `[Ruta archivo, Endpoint, Tabla BD]`  
**CVE/CWE:** `[Si aplica: CVE-YYYY-XXXXX, CWE-XXXX]`

#### 1. Descripción del Hallazgo
Explicación objetiva de qué está mal.

#### 2. Evidencia (Reproducibilidad)
- Snippet de código con línea exacta.
- Comando para verificar y resultado observado.

#### 3. Impacto
- **Técnico y de Negocio.**

#### 4. Recomendación (Con código de corrección sugerido)
- Estrategias de mitigación.

---

# FASE 3: PRIORIZACIÓN & RISK MATRIX

Se prioriza según la probabilidad de explotación y el impacto técnico/financiero.

---

# FASE 4: STANDARDS COMPLIANCE CHECKLIST

Verificar OWASP Top 10, GDPR, PCI-DSS e ISO 27001 según corresponda.

---

# APÉNDICE: HERRAMIENTAS & SCRIPTS

## A.1 Herramientas Recomendadas por Capa
- **Postgres:** pgBadger, pg_stat_statements.
- **APM:** OpenTelemetry, Prometheus, Datadog.
- **SAST:** Semgrep, SonarQube.
- **SCA:** Trivy, Snyk.

## FASE 5: AUDITORÍA COGNITIVA AUTOMATIZADA (AURAAUDIT)

Ejecutar AuraAudit CLI para acelerar el escaneo:
```bash
python AuraAudit/main.py /ruta/al/proyecto --output-dir /ruta/de/reportes
```
