# Manual Técnico Completo para Desarrolladores — Módulo ConsultaSmart (Universal RAG)
**C&A Smart Systems — Edición Profesional Ampliada v3.0 (Julio 2026)**

Este documento contiene la documentación técnica exhaustiva, diagramas de secuencia, arquitectura de microservicios, estructura completa en PostgreSQL, pipeline de RAG, sistema de caché en Redis, referencia completa de la API REST (con matriz real de autenticación/autorización por endpoint), rate limiting, hallazgos y remediación de la auditoría de seguridad del 2026-07-22, conformidad con los estándares de `docs/skills/` y `docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`, y guía de extensión para desarrolladores.

**Convención de confianza usada en este documento** (ver `docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` §0): cada hallazgo se marca **[Cierto]** (verificado leyendo el código real, citado archivo:línea), **[Probable]** (inferido de patrones consistentes) o **[Hipótesis]** (sospecha razonable, no verificada). Ningún hallazgo de esta ronda se declara "100% corregido" sin la cita exacta del cambio aplicado.

---

## 1. Visión General y Arquitectura de Sistemas

ConsultaSmart es la solución empresarial RAG (*Retrieval-Augmented Generation*) desarrollada por **C&A Smart Systems**. Ha sido diseñada bajo una arquitectura desacoplada de alto rendimiento que soporta comportamiento **Multitenant (Multi-Chatbot)** lógico en una única infraestructura (nota de alcance en §8.4: el aislamiento actual es lógico por `category`/`profile_id`, no por autorización a nivel de fila — ver hallazgo AUTH-04).

### Diagrama de Arquitectura de Alto Nivel

```
                    ┌────────────────────────────────────────┐
                    │     Clientes Web & Aplicativos Web     │
                    │   (Portal React 18 / SDK Widget JS)    │
                    └───────────────────┬────────────────────┘
                                        │ (HTTP REST / JSON)
                                        ▼
                    ┌────────────────────────────────────────┐
                    │    API Gateway & Backend (FastAPI)     │
                    │  App Core, Routes & ORM Async Engine   │
                    └───────┬───────────────┬───────────┬────┘
                            │               │           │
            ┌───────────────┘               │           └──────────────┐
            ▼                               ▼                          ▼
┌─────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────┐
│   PostgreSQL Database   │   │     Redis Cache Layer     │   │ Base de Conocimiento RAG │
│  chatbot_profiles, etc. │   │ Caché híbrida & Celery    │   │ PyMuPDF & Embeddings LLM │
└─────────────────────────┘   └───────────────────────────┘   └──────────────────────────┘
```

### Componentes de la Arquitectura Backend y Frontend

1. **Frontend (SPA React 19 + Vite + Tailwind CSS):**
   - Router configurado con **React Router v7** con future flags habilitados (`v7_startTransition`, `v7_relativeSplatPath`) — `App.jsx`.
   - Gestión de estado global con **Zustand** (`authStore.js`, `chatStore.js`, `documentStore.js`), sin middleware `persist` — el token se guarda manualmente en `localStorage`.
   - Autenticación vía `react-oidc-context` contra Authentik (`authority: https://auth.casmart.internal/application/o/consulta-smart/`, `App.jsx:17`), sin formulario de usuario/contraseña local (`LoginPage.jsx` delega 100% a `auth.signinRedirect()`).
   - Páginas principales (`frontend/src/pages/`, ver README colocalizado en esa carpeta):
     - `AdminPage.jsx` (1412 líneas, componente monolítico sin subcomponentes): dos pestañas — **"Configuración de Chatbots & Temas"** (selector de tema/tenant, galería de 12 plantillas de sector precableadas en JSX, generador de System Prompt vía meta-prompting CRAFT/CREA/ASPECCT, parámetros de guardrails —`strictness_level`, `strictness_score`, `temperature`, `forbidden_topics`, `rejection_message`—, integración de widget, sandbox de prueba en vivo) y **"Gestión de Usuarios (Authentik / Roles)"** (tabla de usuarios, asignación de rol admin/user contra `POST /admin/users/{id}/role`, ahora con confirmación explícita — ver §8).
     - `ChatPage.jsx` / `ChatInterface.jsx`: interfaz universal de conversación RAG con conmutador de chatbots en vivo (lee `tenantId`/`profile_id` de query params) y renderizado de Markdown.
     - `WidgetIntegrationPage.jsx`: generador de snippets `<script>` e `<iframe>` dinámicos para embeber el widget en sitios externos.
     - `DocumentsPage.jsx` + `components/DocumentUpload.jsx`: gestión real de documentos RAG (subida, listado) — nota: `AdminPage.jsx` define funciones equivalentes (`handleUploadDocument`, `handleDeleteDocument`, etc.) que no están conectadas a ningún elemento del JSX (código muerto, ver README de `frontend/src/pages/`).

2. **Backend (Python 3.11 + FastAPI + AsyncIO):**
   - **Framework:** FastAPI con rutas organizadas por dominio (`app/routes/admin.py`, `chat.py`, `documents.py`, `search.py`, `auth.py`, `health.py`, `perf_test.py`).
   - **ORM Async:** SQLAlchemy AsyncEngine conectado a PostgreSQL (`app/infrastructure/models.py`).
   - **Vector & Embeddings:** servicio de embeddings locales / Groq / GCP / NVIDIA NIM con fallback automático en `smart_llm_router.py`.
   - **Background:** Celery + Redis para procesamiento asíncrono de documentos (`app/workers/celery_app.py`, `process_document_task`).
   - **Storage:** SeaweedFS para el almacenamiento de archivos originales subidos (`seaweedfs_service.py`).

---

## 2. Modelo de Datos Completo en PostgreSQL

Todas las entidades están modeladas en SQLAlchemy Async (`app/infrastructure/models.py`). Tablas reales verificadas [Cierto]:

| Tabla | Columnas clave | Notas |
|---|---|---|
| `users` | `id` (str36, uuid), `email` (unique), `username` (unique), `password_hash` (nullable — Authentik gestiona la auth), `is_active`, `roles` (JSON, default `["user"]`) | Auto-registro al primer login vía Authentik (`auth_utils.py`) |
| `documents` | `id`, `title`, `category`, `user_id` (FK→`users.id`), `file_type`, `seaweedfs_file_id` (unique), `status`, `chunk_count`, `token_count`, `group_id`/`version`/`version_label` (versionado), `is_active`, `effective_date`/`expiration_date`, `doc_metadata` (JSON) | `chunks` con `cascade="all, delete-orphan"` |
| `document_chunks` | `id`, `document_id` (FK), `chunk_number`, `text`, `token_count`, `embedding` (`Vector(384)`, pgvector, nullable), `doc_metadata` | El `embedding` puede ser `NULL` si la generación falló (ver hallazgo RAG-01) |
| `vector_embeddings` | — | Tabla presente en el modelo pero sin uso activo confirmado en las rutas actuales (los embeddings reales viven en `document_chunks.embedding`) |
| `chat_sessions` | `id`, `user_id` (FK), `title`, `doc_metadata`, `total_tokens_used` | `messages` con cascade delete-orphan |
| `chat_messages` | `id`, `session_id` (FK), `role`, `content`, `sources` (JSON), `tokens_used` | |
| `system_configs` | `key` (PK), `value`, `description` | Config genérica clave/valor |
| `chatbot_profiles` | `id` (str50, PK **libre, sin FK a tenant/owner**), `name`, `system_prompt`, `welcome_message`, `title`, `subtitle`, `logo_url`, `icon`, `primary_color`, `strictness_level`, `strictness_score`, `temperature`, `top_p`, `forbidden_topics`, `rejection_message`, `config_metadata` (JSON), `is_active` | **Sin columna `owner_id`/`created_by`** — ver hallazgo AUTH-04 |

### DDL de referencia (`chatbot_profiles`)

```sql
CREATE TABLE IF NOT EXISTS chatbot_profiles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    system_prompt TEXT NOT NULL,
    welcome_message TEXT NOT NULL,
    title VARCHAR(100),
    subtitle VARCHAR(200),
    logo_url VARCHAR(500),
    icon VARCHAR(50) DEFAULT 'Bot',
    primary_color VARCHAR(20) DEFAULT '#3b82f6',
    strictness_level VARCHAR(20) DEFAULT 'strict',
    strictness_score INT DEFAULT 85,
    temperature FLOAT DEFAULT 0.1,
    top_p FLOAT DEFAULT 0.9,
    forbidden_topics TEXT,
    rejection_message TEXT,
    config_metadata JSON DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Justificación `TEXT`/`VARCHAR` vs `JSON`:** los campos de lectura intensiva se mantienen en columnas atómicas para indización directa; `config_metadata` es el contenedor flexible (audiencia, organización, sector, catálogos LOV) sin requerir `ALTER TABLE`.

---

## 3. Autenticación y Autorización (verificado contra el código real, 2026-07-22)

### 3.1 Mecanismo real

- El backend valida JWTs de **Authentik OIDC** contra su JWKS remoto (`app/core/auth_utils.py`, `PyJWKClient`), con **fallback** a un JWT local firmado con `settings.JWT_SECRET` si la validación Authentik falla (usado por el flujo de widget). Existe además un módulo `keycloak_auth.py` completo pero **no usado por ninguna ruta** — código muerto/obsoleto, no reflejar en documentación de usuario como mecanismo real.
- El frontend (`react-oidc-context`) nunca maneja contraseñas propias; todo el login interactivo pasa por `auth.signinRedirect()` hacia Authentik.
- **Widget embebible público:** `POST/GET /api/v1/auth/guest` autentica contra un usuario técnico dedicado (`settings.WIDGET_EMAIL`/`WIDGET_PASSWORD`, antes hardcodeado en el código fuente — ver hallazgo AUTH-03) y emite un JWT local con `is_widget: true` y rol `["user"]`.
- `get_current_user` auto-registra en la tabla `users` a cualquier usuario válido de Authentik que no exista aún localmente, siempre con rol `["user"]` (la promoción a `admin` es exclusivamente responsabilidad de `POST /admin/users/{id}/role`).
- `GET /api/v1/auth/me` (nuevo, 2026-07-22) devuelve la identidad y rol reales del usuario autenticado — es lo que el frontend usa para decidir si mostrar la UI de administrador, en reemplazo del backdoor descrito en AUTH-01.

### 3.2 Autorización — dependencia centralizada

Todas las rutas que requieren rol de administrador usan `require_admin` (`app/core/auth_utils.py`):

```python
async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requieren permisos de administrador.")
    return current_user
```

Antes de la auditoría del 2026-07-22, este chequeo estaba reimplementado inline y de forma inconsistente en 6 puntos distintos de `admin.py`/`documents.py`, y **ausente por completo** en 7 endpoints mutantes de `admin.py` — ver §8 para el detalle completo.

### 3.3 Scoping por usuario (BOLA) — dónde SÍ existe

`documents.py` sí implementa scoping correcto de propiedad: `GET /documents/{id}` verifica `document.user_id == current_user["id"] OR "admin" in roles` (línea 137); las rutas de sesión de chat (`chat.py`) verifican `session.user_id == current_user["id"]` antes de leer/actualizar/borrar. Este es el patrón de referencia a replicar en cualquier endpoint nuevo que resuelva un objeto por ID.

---

## 4. Metodología de Prompts CRAFT (Meta-Prompting Maestro)

Todos los prompts del sistema están estructurados mediante la metodología **CRAFT** (o, alternativamente, **CREA**/**ASPECCT**, seleccionables en `AdminPage.jsx`) utilizando delimitadores XML claros. Esto previene desviaciones de tema, alucinaciones del LLM y garantiza respuestas estructuradas.

### Estructura Canónica de un Prompt CRAFT

```xml
Eres el **Consultor Oficial de [Nombre del Servicio/Tenant]**.

<contexto>
Operas como el canal oficial de atención inteligente para [Organización / Dependencia]. Tu objetivo es orientar sobre [Trámites, servicios, normativas]. Responde prioritariamente consultando la base de conocimientos RAG bajo '## MANUALES TÉCNICOS OFICIALES'.
</contexto>

<rol>
Actúa con personalidad [Rol profesional], ofreciendo un trato amable, claro, institucional y estructurado.
</rol>

<instrucciones>
1. Analiza la pregunta del usuario e identifica el trámite o información requerida.
2. Proporciona requisitos, costos, horarios y pasos detallados.
3. Si la respuesta está contenida en los documentos RAG, proporciónala directamente.
</instrucciones>

<reglas>
- Cero Alucinaciones: No inventes fechas, costos ni requisitos.
- Filtro de Dominio: Rechaza educadamente cualquier consulta ajena a [Nombre del Servicio].
- Tono: Formal, claro y en formato Markdown con viñetas.
</reglas>

<ejemplos>
**Pregunta:** ¿Cuáles son los requisitos principales?
**Respuesta:** Los requisitos son: 1) Identificación oficial, 2) Comprobante de domicilio, 3) Formato de solicitud.
</ejemplos>
```

El generador (`POST /api/v1/admin/generate-prompt`, ahora protegido con `require_admin` y rate limiting — ver §6/§8) construye esta estructura automáticamente vía LLM a partir de tema, audiencia, organización y sector.

---

## 5. Pipeline Completo de Procesamiento RAG & Guardrails

El flujo de procesamiento de cada pregunta recibida en `POST /api/v1/chat/query` sigue una secuencia rigurosa:

```
[ Consulta de Usuario ]
          │
          ▼
[ 1. Carga de Perfil ChatbotProfile desde PostgreSQL ]
          │
          ▼
[ 2. Evaluación de Guardrail de Tópicos Prohibidos ] ──► (Si coincide: Respuesta Rechazo Inmediata)
          │
          ▼
[ 3. Búsqueda Vectorial RAG en Base de Conocimiento ]
          │
          ├───────────────────────────────┐
          ▼ (Documentos Encontrados)      ▼ (Sin Documentos)
[ Inyección de Contexto RAG ]    [ Evaluador Dinámico Fallback ]
          │                               │
          └───────────────┬───────────────┘
                          ▼
            [ Generación LLM Smart Router ]
                          │
                          ▼
            [ Blindaje / Grounding Check ]
                          │
                          ▼
            [ Respuesta Final al Usuario ]
```

**Hallazgo RAG-01 [Cierto]** (`admin.py`, generación de embeddings en `upload_chatbot_document`): si la generación de embedding falla para un chunk, el chunk se guarda igualmente con `embedding=None` y el documento queda marcado `status="indexed"` sin que el admin reciba ninguna alerta — si falla para todos los chunks, el documento "aparece indexado" pero es invisible para la búsqueda vectorial. Pendiente: reflejar el conteo de chunks sin embedding en la respuesta de éxito del upload.

**Manejo de errores documentado como intencional** (`chat.py::chat_query`): el guardado del mensaje del usuario está en un `try/except` con `rollback()` que **continúa la ejecución** aunque falle ("para no bloquear al usuario", comentario en código) — es una decisión de UX consciente, pero implica que puede responderse al usuario sin haber persistido su propio mensaje; documentarlo en cualquier ticket de soporte sobre "mensajes que desaparecen".

---

## 6. Rate Limiting y Protección de Recursos (nuevo, 2026-07-22)

Ningún endpoint tenía límite de tasa antes de esta auditoría (hallazgo DOS-01, §8). Se agregó `app/core/rate_limit.py`: un limitador de ventana deslizante en memoria, sin dependencias nuevas de pip, aplicado como `Depends`/`dependencies=[...]` a los endpoints que invocan LLM o procesan archivos:

| Endpoint | Límite aplicado |
|---|---|
| `POST /api/v1/admin/generate-prompt` | 10 solicitudes / 60s por IP |
| `POST /api/v1/admin/chatbot/documents/upload` | 5 solicitudes / 60s por IP |
| `POST /api/v1/documents/upload` | 5 solicitudes / 60s por IP |
| `POST /api/v1/chat/query` | 30 solicitudes / 60s por IP |

**Limitación conocida:** el contador vive en memoria de cada proceso; con más de un worker/réplica Uvicorn, el límite efectivo se multiplica por el número de procesos. Migrar a un backend compartido (Redis `INCR`+`EXPIRE`) es el siguiente paso si el despliegue real corre con >1 worker — documentado también en el propio módulo.

---

## 7. Catálogo Completo de API REST (matriz real de auth, verificada 2026-07-22)

| Método | Ruta | Auth requerida | Notas |
|---|---|---|---|
| GET/POST | `/api/v1/admin/configs`, `/configs/{key}` | `require_admin` (antes: ninguna) | |
| POST | `/api/v1/admin/generate-prompt` | `require_admin` + rate limit (antes: ninguna) | Meta-prompting CRAFT/CREA/ASPECCT |
| GET | `/api/v1/admin/chatbot/profiles` | Pública (por diseño, widget embebible) | `response_model` sanitizado — ya no expone `system_prompt`/guardrails |
| POST | `/api/v1/admin/chatbot/profiles` | `require_admin` (antes: ninguna) | Crea/actualiza tema+guardrails de un tenant |
| DELETE | `/api/v1/admin/chatbot/profiles/{id}` | `require_admin` | Ya tenía protección; se centralizó el chequeo |
| GET | `/api/v1/admin/chatbot/documents` | `require_admin` (antes: ninguna) | |
| POST | `/api/v1/admin/chatbot/documents/upload` | `require_admin` + rate limit (antes: ninguna) | |
| DELETE | `/api/v1/admin/chatbot/documents/{id}` | `require_admin` | |
| POST | `/api/v1/admin/chatbot/documents/{id}/toggle` \| `/category` | `require_admin` (antes: ninguna) | |
| GET | `/api/v1/admin/users` | `require_admin` | |
| POST | `/api/v1/admin/users/{id}/role` | `require_admin` | Escalación de privilegios; frontend ahora pide confirmación |
| POST | `/api/v1/documents/upload` | `require_admin` + rate limit | |
| GET | `/api/v1/documents/{id}` | Autenticado + dueño u admin (BOLA correcto) | |
| GET | `/api/v1/documents` | Autenticado | Ya no filtra a "todos" como fallback (hallazgo BOLA-02 corregido) |
| POST | `/api/v1/documents/load-rpp-registry` | `require_admin` | |
| POST | `/api/v1/chat/query` | Autenticado + rate limit | Pipeline RAG principal |
| GET/POST/PUT/DELETE | `/api/v1/chat/sessions...` | Autenticado + dueño (BOLA correcto) | |
| GET | `/api/v1/chat/profiles/{id}` | Pública | Theming del widget, no expone datos sensibles |
| GET/POST | `/api/v1/auth/guest` | Pública (usuario técnico del widget) | Ver §3.1 |
| GET | `/api/v1/auth/me` | Autenticado | Nuevo — identidad/rol real |
| GET/POST | `/api/v1/search` | Autenticado (sin rol específico) | |
| — | `/api/perf_test/*` | **Pública, sin auth** | Endpoints de performance testing expuestos sin protección — ver hallazgo INFO-01 |

---

## 8. Auditoría de Seguridad — Hallazgos y Remediación (ronda 2026-07-22)

Metodología aplicada: mapeo mutación↔disparador↔protección de `docs/SKILL.md` (universal-code-audit) contra el catálogo de `docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`. Evidencia: lectura directa del código real (`app/routes/*.py`, `app/core/*.py`, `frontend/src/**`), no de un reporte previo — el reporte anterior embebido en `CA-CS-M-01` declaraba "BOLA/BFLA VERIFICADO [Cierto]" de forma genérica; esta ronda encontró que esa afirmación era falsa para 7 de los endpoints reales de `admin.py` (ver §8 SKILL.md: "no confíes en un audit previo que declaró completado").

| ID | Severidad | Hallazgo | Evidencia [Cierto] | Estado |
|---|---|---|---|---|
| AUTH-01 | **Crítico** | Backdoor de escalación de privilegios: cualquier cuenta con `"israelm"`/`"victor"`/`"millan"` en email/username recibía rol `admin` automáticamente en cada login, revirtiendo revocaciones hechas desde el panel. Duplicado en frontend (`authStore.js`). | `auth_utils.py` (antes de la corrección, líneas ~104 y ~122-127); `authStore.js` (antes, líneas ~20-27) | **Corregido** — eliminado en ambos lados; rol real vía `GET /auth/me` |
| AUTH-02 | **Crítico** | 7 endpoints mutantes de `admin.py` sin ninguna autenticación: cualquiera (autenticado o no) podía crear/editar perfiles de chatbot (system prompts, guardrails) y subir/activar/reclasificar documentos RAG. | `admin.py` rutas `configs`, `generate-prompt`, `POST chatbot/profiles`, `chatbot/documents` (GET, upload, toggle, category) | **Corregido** — `require_admin` agregado a las 7 |
| AUTH-03 | **Alto** | Credenciales del widget hardcodeadas en texto plano en el repo (`auth.py`). | `routes/auth.py` (antes de la corrección) | **Corregido en código** (movidas a `settings.WIDGET_EMAIL/PASSWORD`, override por Vault) — **pendiente operativo:** rotar el valor real en la BD, ya que el que estaba en el repo debe considerarse comprometido |
| SEC-01 | **Alto** | Fallbacks hardcodeados y predecibles de `DB_PASSWORD`/`SECRET_KEY`/`JWT_SECRET` en `config.py`, usados silenciosamente si Vault fallaba. | `config.py` (antes de la corrección) | **Corregido** — en `APP_ENV=production` el proceso aborta el arranque si Vault no entrega los 3 secretos; sin cambios en desarrollo |
| BOLA-01 | **Alto** | `ChatbotProfile`/`Document.category` no tienen columna owner/tenant — no hay aislamiento de autorización entre tenants, solo agrupación lógica. | `models.py` (`ChatbotProfileModel`, sin `owner_id`) | **No corregido — requiere decisión de producto.** Hoy el modelo real es "un solo equipo administrador gestiona todos los tenants" (consistente con que `require_admin` ya protege las mutaciones). Si en el futuro se requieren administradores *por tenant*, hace falta rediseño de esquema (columna owner + scoping real) — no se implementó a ciegas en esta ronda por ser un cambio de arquitectura, no un fix puntual |
| BOLA-02 | **Medio** | `GET /api/v1/documents` mostraba TODOS los documentos del sistema como "fallback" a cualquier usuario no-admin sin documentos propios. | `documents.py::list_documents` (antes de la corrección, líneas ~177-179) | **Corregido** — devuelve lista vacía en ese caso |
| SEC-02 | **Medio** | Verificación TLS deshabilitada (`ssl.CERT_NONE`) al validar el JWKS de Authentik. | `auth_utils.py` | **No corregido a ciegas** — requiere el certificado real de la CA interna de `auth.casmart.internal`, no disponible en este entorno de auditoría; documentado con `logger.warning` explícito en el propio módulo |
| DOS-01 | **Medio** | Sin rate limiting en ningún endpoint, incluyendo los que invocan LLM (costo) y subida de archivos. | Ausencia confirmada por grep en `main.py` y rutas | **Corregido** — ver §6 |
| RAG-01 | **Bajo** | Falla de embedding silenciosa deja documentos "indexed" sin vectores reales. | `admin.py::upload_chatbot_document` | **Documentado, no corregido** — requiere decidir política de UX (¿reintentar? ¿marcar como `degraded`?) |
| INFO-01 | **Bajo/Info** | `perf_test` router incluido sin ningún prefijo de auth (`main.py:96-97`, comentario propio "sin auth"). | `main.py` | **Documentado, no corregido** — evaluar si debe exponerse solo en `APP_ENV=development` |
| DEUDA-01 | **Bajo/Info** | Código muerto: `keycloak_auth.py` (no importado), funciones de gestión de documentos en `AdminPage.jsx` sin UI que las invoque, README raíz describiendo una arquitectura Flowise no reflejada en el código real. | Ver README de `frontend/src/pages/` y grep de imports | **Documentado, no corregido** — limpieza de bajo riesgo para una ronda futura |

**No corregido ≠ ignorado:** BOLA-01, SEC-02, RAG-01 e INFO-01 se dejaron sin tocar deliberadamente porque su fix correcto requiere información/decisiones que no están disponibles en este entorno (certificado real de CA, decisión de producto sobre multi-tenancy, política de UX) — aplicar un cambio a ciegas ahí sería más riesgoso que documentarlo con precisión para la siguiente ronda (ver `docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` §8, disciplina de verificación).

---

## 9. Documentación Colocalizada por Módulo

Siguiendo `docs/skills/generacion-documentacion/SKILL.md`, se crearon los `README.md` colocalizados (antes inexistentes en cualquier subcarpeta de features/módulos del proyecto) para los módulos tocados en esta ronda:

- `consulta-smart/backend/app/routes/README.md`
- `consulta-smart/backend/app/core/README.md`
- `consulta-smart/frontend/src/pages/README.md`
- `consulta-smart/frontend/src/stores/README.md`

Cada uno documenta únicamente cambios de impacto estructural/de seguridad (no typos ni CSS), con fecha, autor y descripción concreta, siguiendo el formato de bitácora append-only del skill. **Recomendación:** extender el mismo patrón a `frontend/src/components/`, `backend/app/infrastructure/` y `backend/app/application/` en la próxima iteración significativa de esas carpetas.

---

## 10. Conformidad con Estándares de `docs/skills/`

`docs/skills/` contiene skills genéricos para **cualquier proyecto** del portafolio C&A Smart Systems, no específicos de ConsultaSmart. Aplicabilidad real verificada:

| Skill | Aplica a ConsultaSmart | Nota |
|---|---|---|
| `generacion-documentacion` | ✅ Sí | Aplicado en esta ronda (§9) |
| `auth-architecture`, `primeng21-expert`, `theming-architecture`, `generacion-componentes-ts/html`, `generacion-dtos`, `generacion-servicios`, `generacion-pruebas-servicios` | ❌ No directamente | Escritos para un stack **Angular + PrimeNG** (rutas tipo `src/app/core/...`, `NgModule`, componentes `.component.ts`); ConsultaSmart es **React 19 + Vite + FastAPI**. Forzar sus convenciones literales (ej. estructura de carpetas Angular) degradaría el proyecto sin beneficio real — el principio subyacente de cada skill (separación de capas, DTOs tipados, pruebas por servicio, documentación de arquitectura de auth) sí se cumple hoy con sus equivalentes React/FastAPI (Pydantic DTOs en `admin.py`/`documents.py`, `pytest` en `backend/tests/`, este mismo manual como documento de arquitectura de auth) |
| `reordenacion_arquitectonica` | Parcial | El principio de organizar por feature/dominio ya se sigue en el backend (`app/routes`, `app/domain`, `app/infrastructure`, `app/application`); el frontend (`AdminPage.jsx` monolítico de 1412 líneas) es el candidato más claro a una reordenación futura en subcomponentes por sección (perfiles, generador de prompts, gestión de usuarios) |

**Conclusión:** no se fuerza ningún patrón Angular/PrimeNG sobre este proyecto React; se documenta la equivalencia funcional y se aplica literalmente el único skill que sí es agnóstico de stack (`generacion-documentacion`).

---

## 11. Documentación Embebida y Comentarios de Código

- **Módulos Backend (Python):** rutas FastAPI y clases de dominio documentadas con docstrings; los cambios de esta auditoría incluyen comentarios explicando el *por qué* (referencia al hallazgo), no solo el *qué*, en `auth_utils.py`, `config.py`, `admin.py`, `documents.py`, `rate_limit.py`.
- **Módulos Frontend (React / JSX):** `AdminPage.jsx`, `authStore.js` documentan con comentarios el reemplazo del backdoor de rol por la resolución legítima vía `/auth/me`.

---

## 12. Manual de Despliegue de SDK Widget Web

El widget flotante se integra agregando el snippet oficial en el archivo HTML del cliente:

```html
<!-- ConsultaSmart Widget Snippet -->
<script 
  src="https://chat.casmart.internal/widget.js" 
  data-tenant-id="control_escolar"
  data-primary-color="#059669"
  data-title="Control Escolar"
  async>
</script>
```

El widget consume `GET /api/v1/admin/chatbot/profiles` (público, ahora sanitizado — §7) para theming y `POST /api/v1/auth/guest` para autenticarse con el usuario técnico dedicado antes de llamar `POST /api/v1/chat/query`.

---

## 13. Firmas de Conformidad Técnica

| Elaboró e Implementó | Aprobó y Autorizó |
| :--- | :--- |
| **Israel Martínez Hernández**<br>*Líder de Arquitectura e Inteligencia Artificial*<br>_(auditoría y remediación de seguridad 2026-07-22 asistida por Claude)_ | **Yareth Mora Resendiz**<br>*Directora de Tecnología y Sistemas* |

### Control de versiones

| Versión | Fecha | Autor | Descripción del cambio |
|---|---|---|---|
| 2.5 | Julio 2026 | Israel Martínez Hernández | Edición profesional ampliada original |
| 3.0 | 2026-07-22 | Claude (asistido) | Se incorpora: modelo de datos completo (todas las tablas), sección de autenticación/autorización real, matriz de auth por endpoint, rate limiting, auditoría de seguridad completa con hallazgos [Cierto] y su remediación aplicada en código, documentación colocalizada por módulo, y conformidad con `docs/skills/`. El contenido de arquitectura/auditoría que antes vivía incorrectamente en el manual de usuario `CA-CS-M-01` se consolidó aquí. |
