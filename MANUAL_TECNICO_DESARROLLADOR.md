# Manual Técnico Completo para Desarrolladores — Módulo ConsultaSmart (Universal RAG)
**C&A Smart Systems — Edición Profesional Ampliada v3.3 (Julio 2026)**

Este documento contiene la documentación técnica exhaustiva, diagramas de secuencia, arquitectura de microservicios, estructura completa en PostgreSQL, pipeline de RAG (incluyendo retrieval híbrido y LLM personalizado por tema), sistema de caché en Redis, referencia completa de la API REST (con matriz real de autenticación/autorización por endpoint), rate limiting, hallazgos y remediación de tres rondas de auditoría/mejora (2026-07-22 mañana y tarde, 2026-07-29), gestión de configuración con bitácora de cambios y restauración (CMMI CM, §14.11), fuga de contenido de un tenant específico al fallback genérico y su corrección de raíz (§15), motor LLM completo por tema con catálogo de modelos en vivo (§15), conformidad con los estándares de `docs/skills/`, `docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` y `docs/ESTANDAR_CMMI_UNIVERSAL.md`, y guía de extensión para desarrolladores.

**Nota de procedencia:** la segunda ronda de funcionalidades (salud de indexado, regresión de prompts, feedback de usuario, retrieval híbrido, LLM por tema, observabilidad) fue implementada por el equipo con **Google Antigravity**; esta revisión verificó ese código contra el sistema real en ejecución (contenedor Docker `consulta-smart-backend`, base de datos PostgreSQL real) y corrigió los hallazgos encontrados — ver §14.

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
| `chat_messages` | `id`, `session_id` (FK), `role`, `content`, `sources` (JSON), `feedback_rating` (`'up'`/`'down'`/`NULL`, nuevo), `feedback_text` (nuevo), `tokens_used` | Columnas de feedback agregadas 2026-07-22 tarde — ver hallazgo MIG-01 (§14) sobre por qué requirieron un parche de esquema manual |
| `system_configs` | `key` (PK), `value`, `description` | Config genérica clave/valor |
| `chatbot_profiles` | `id` (str50, PK **libre, sin FK a tenant/owner**), `name`, `system_prompt`, `welcome_message`, `title`, `subtitle`, `logo_url`, `icon`, `primary_color`, `strictness_level`, `strictness_score`, `temperature`, `top_p`, `forbidden_topics`, `rejection_message`, `llm_provider` (default `"default"`), `llm_model`, `custom_api_key` (**cifrado at rest** — ver §14.5), `custom_base_url` (nuevo 2026-07-29, endpoint del proveedor — obligatorio para `ollama`, opcional para gateways propios de `openai`/`nvidia`/`mistral`, ver §17.3), `config_metadata` (JSON), `is_active` | **Sin columna `owner_id`/`created_by`** — ver hallazgo AUTH-04 |
| `prompt_test_cases` | `id`, `profile_id` (FK→`chatbot_profiles.id`), `query`, `expected_keywords` (JSON, lista), `description` | Nueva tabla (2026-07-22 tarde) — batería de regresión de prompts por tema, ver §14.2 |
| `chatbot_profile_audit_log` | `id`, `profile_id` (sin FK — sobrevive al borrado del perfil), `action` (`create`/`update`/`delete`/`restore`), `changed_by_id`/`changed_by_email`, `before`/`after` (JSON, snapshot **sin** `custom_api_key`), `created_at` | Nueva tabla (2026-07-22 tarde) — bitácora de cambios y restauración, práctica CMMI CM, ver §14.11 |

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
    llm_provider VARCHAR(50) DEFAULT 'default',
    llm_model VARCHAR(100),
    custom_api_key VARCHAR(255),
    custom_base_url VARCHAR(255), -- agregada 2026-07-29 vía _SCHEMA_PATCHES (ver §14.6/MIG-01)
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
| GET | `/api/v1/admin/chatbot/profiles/admin-list` | `require_admin` | Nuevo — perfiles completos con `llm_provider`/`llm_model` y `custom_api_key` **enmascarada** (nunca en claro) |
| POST | `/api/v1/admin/chatbot/profiles` | `require_admin` (antes: ninguna) | Crea/actualiza tema+guardrails de un tenant; `custom_api_key` se cifra antes de guardar (§14.5) |
| DELETE | `/api/v1/admin/chatbot/profiles/{id}` | `require_admin` | Ya tenía protección; se centralizó el chequeo. Rechaza `id="general"` con 400 (solo lectura) |
| GET | `/api/v1/admin/chatbot/profiles/{id}/audit-log` | `require_admin` | Nuevo — historial de cambios del tema (CMMI CM, §14.11) |
| POST | `/api/v1/admin/chatbot/profiles/{id}/restore/{audit_log_id}` | `require_admin` | Nuevo — restaura el tema a un snapshot previo de la bitácora |
| GET | `/api/v1/admin/chatbot/profiles/{id}/test-cases` \| POST \| DELETE `/test-cases/{case_id}` | `require_admin` | Nuevo — CRUD de casos de regresión de prompts (§14.2) |
| POST | `/api/v1/admin/chatbot/profiles/{id}/run-regression` | `require_admin` | Nuevo — ejecuta la batería de regresión contra el System Prompt vigente (§14.2) |
| GET | `/api/v1/admin/chatbot/documents` | `require_admin` (antes: ninguna) | Ahora incluye `embedded_chunk_count`/`health_pct` por documento (§14.1) |
| POST | `/api/v1/admin/chatbot/documents/upload` | `require_admin` + rate limit (antes: ninguna) | |
| POST | `/api/v1/admin/chatbot/documents/{id}/reindex` | `require_admin` | Nuevo — reintenta el embedding de un documento sin re-subir el archivo (§14.1) |
| DELETE | `/api/v1/admin/chatbot/documents/{id}` | `require_admin` | |
| POST | `/api/v1/admin/chatbot/documents/{id}/toggle` \| `/category` | `require_admin` (antes: ninguna) | |
| GET | `/api/v1/admin/users` | `require_admin` | |
| POST | `/api/v1/admin/users/{id}/role` | `require_admin` | Escalación de privilegios; frontend ahora pide confirmación |
| GET | `/api/v1/admin/stats/llm-router` | `require_admin` | Nuevo — panel de observabilidad: proveedores activos, feedback agregado, estado de caché (§14.4) |
| POST | `/api/v1/chat/messages/{id}/feedback` | Autenticado + dueño (BOLA corregido) | Nuevo — 👍/👎 por respuesta; verificaba solo que el mensaje existiera, sin checar dueño de la sesión — corregido con `JOIN` a `chat_sessions.user_id` (§14.3) |
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

## 14. Segunda Ronda — Funcionalidades de IA/UX y su Revisión (2026-07-22, tarde)

Esta ronda implementó (equipo + Google Antigravity) las tres propuestas iniciales del informe de análisis de sistemas CA-CS-A-01 más varias adicionales. Cada una se verificó contra el contenedor real `consulta-smart-backend` en ejecución (no solo lectura de código) — incluyendo consultas directas a la base de datos PostgreSQL real y pruebas de construcción de objetos Python dentro del contenedor.

### 14.1 Salud de indexado y reintento (Prioridad #2 del informe)

`GET /api/v1/admin/chatbot/documents` ahora calcula, por documento, `embedded_chunk_count` y `health_pct` (porcentaje de chunks con embedding real vs. total) mediante una subconsulta agregada (`func.count`/`func.sum(case(...))`). `POST /admin/chatbot/documents/{id}/reindex` reconstruye los chunks a partir del texto ya extraído (sin re-subir el archivo) y regenera los embeddings, actualizando `chunk_count`/`status`/`processing_error`. En el frontend, `components/DocumentUpload.jsx` muestra una barra de salud con color semántico (`--cs-success`/`--cs-warning`/`--cs-danger` según `health_pct`) y un botón "Reintentar" con estados `loading`/`done`/`error` y auto-limpieza. **Verificado [Cierto]:** construcción y llamada real dentro del contenedor, sin errores; consulta agregada probada contra la tabla `document_chunks` real.

### 14.2 Batería de regresión de prompts (Prioridad #6 del informe)

Nueva tabla `prompt_test_cases` (pregunta + `expected_keywords` esperadas por tema) y endpoint `POST /admin/chatbot/profiles/{id}/run-regression`, que ejecuta cada caso guardado contra `chat_service.process_query()` real y marca `is_passed` según si la respuesta contiene las palabras clave esperadas. Permite detectar si un cambio al System Prompt de un tema rompió respuestas que antes eran correctas, antes de publicarlo.

### 14.3 Feedback de usuario 👍/👎 (Prioridad #5 del informe) — BOLA corregido

`POST /api/v1/chat/messages/{id}/feedback` guarda `feedback_rating`/`feedback_text` en `ChatMessageModel`. **Hallazgo [Cierto] encontrado y corregido en esta revisión:** la versión original resolvía el mensaje únicamente por `message_id`, sin verificar que perteneciera a una sesión del usuario autenticado — cualquier usuario con sesión válida podía calificar (o adjuntar comentario a) un mensaje de **otro usuario** si conocía o adivinaba su UUID. Se corrigió agregando un `JOIN` con `ChatSessionModel` filtrando por `user_id` del solicitante, más validación de que `rating` sea exactamente `'up'`/`'down'` y que el mensaje calificado sea de rol `assistant`. `ChatInterface.jsx` ya renderizaba correctamente los botones de feedback con estado visual persistente (`feedbackState`/`msg.feedback_rating`).

### 14.4 Retrieval híbrido y observabilidad del router LLM (Prioridades #3 y #9)

`knowledge_base.py` ahora ejecuta búsqueda léxica (`to_tsvector`/`ts_rank` en español, con fallback `ILIKE`) **en paralelo** con la búsqueda vectorial (`pgvector`, distancia coseno `<=>`), fusionando y deduplicando resultados — resuelve el punto débil documentado de los embeddings puros para folios/identificadores exactos. Las consultas usan SQL parametrizado (`sqlalchemy.text` con bind params), sin riesgo de inyección. `GET /admin/stats/llm-router` expone proveedores activos (Groq/Vertex/NVIDIA NIM/Ollama), tasa de satisfacción agregada (`feedback_rating`) y estado de la caché semántica.

### 14.5 LLM personalizado por tema/tenant — bug de integración corregido + cifrado en reposo

`ChatbotProfileModel` agregó `llm_provider`/`llm_model`/`custom_api_key` para permitir que un tema use un proveedor LLM distinto al global. Dos hallazgos reales encontrados y corregidos en esta revisión:

- **[Cierto] Bug de integración que rompía la función por completo:** `chat_service.py` invocaba `SmartLLMRouter(custom_provider=..., custom_api_key=..., custom_model=...)`, pero el constructor de `SmartLLMRouter` no aceptaba esos parámetros (`TypeError` en cada intento, silenciosamente absorbido por el `try/except` de fallback — la función nunca llegó a usar el proveedor personalizado, aunque el UI y el DTO ya lo exponían). Se implementó `SmartLLMRouter.__init__(custom_provider, custom_api_key, custom_model)` con soporte real para `groq`, `gemini`, `nvidia` y `openai` (vía un adaptador mínimo compatible con la API de OpenAI); `vertex`/`ollama` no aceptan una API key simple y lanzan `ValueError` explícito, capturado por el mismo fallback ya existente. **Verificado [Cierto]:** construcción real de `SmartLLMRouter` con cada variante dentro del contenedor, incluyendo el rechazo correcto de `ollama`.
- **[Cierto] `custom_api_key` se guardaba y usaba en texto plano** en PostgreSQL — un campo que contiene credenciales reales de terceros (OpenAI/Anthropic/etc., con facturación asociada), no un dato decorativo. Se agregó `app/core/crypto.py` (Fernet, clave derivada de `SECRET_KEY`) — se cifra al guardar (`save_chatbot_profile`), se descifra solo en memoria para enmascarar en `admin-list` y para la llamada real al proveedor en `chat_service.py`. Compatible hacia atrás: si un valor no descifra como token Fernet válido (legado), se usa tal cual en vez de fallar. **Verificado [Cierto]:** no había ningún tema con `custom_api_key` configurada en la base real al momento de la revisión, por lo que no fue necesaria una migración de datos existentes.

### 14.6 Corrección de esquema — columnas nuevas ausentes en la base real (MIG-01)

**[Cierto] Hallazgo de mayor severidad práctica de esta ronda:** el proyecto no usa Alembic (está en `requirements.txt` pero nunca se inicializó — sin `alembic.ini` ni `migrations/`); `init_db()` solo ejecuta `Base.metadata.create_all`, que **crea tablas nuevas pero nunca altera una tabla ya existente para agregarle una columna**. Se verificó por introspección directa (`information_schema.columns`) contra la base real que `chatbot_profiles.llm_provider/llm_model/custom_api_key` sí existían (la tabla se recreó después de agregar esos campos al modelo), pero `chat_messages.feedback_rating/feedback_text` **no existían** — cualquier llamada a `GET /admin/stats/llm-router` o `POST /chat/messages/{id}/feedback` fallaba con un error real de PostgreSQL (columna inexistente). Se corrigió en dos niveles: (1) se aplicó `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS ...` directamente contra la base real; (2) se agregó `_apply_schema_patches()` en `app/core/database.py`, ejecutado en cada arranque junto a `create_all`, para que futuras columnas nuevas en tablas existentes no vuelvan a quedar huérfanas. **Recomendación de fondo:** inicializar Alembic formalmente en la próxima iteración mayor de esquema — este parche es una mitigación, no un reemplazo de migraciones versionadas.

### 14.7 Componentes construidos pero nunca conectados — corregido

**[Cierto]** `components/admin/PromptRegressionPanel.jsx` y `components/admin/LLMObservabilityPanel.jsx` (que implementan §14.2 y §14.4 en el frontend) existían como archivos completos y funcionales, pero **no estaban importados por ningún otro archivo del proyecto** — confirmado por grep sobre todo `frontend/src`. El backend de ambas funcionalidades funcionaba (probado directamente contra la API), pero el administrador no tenía forma de acceder a ellas desde la interfaz. Se conectaron en `AdminPage.jsx`: `LLMObservabilityPanel` como una tercera pestaña "Observabilidad", y `PromptRegressionPanel` embebido debajo del panel de configuración del tema activo (recibe `profileId={selectedProfileId}`). De paso se corrigieron dos detalles menores en `PromptRegressionPanel.jsx`: un fragmento `k.strip ? k.strip() : k.trim()` (sintaxis de Python colada en JS — inofensivo porque `.strip` no existe en `String.prototype` y el ternario siempre caía al `.trim()`, pero confuso) y la ausencia de confirmación antes de `handleDeleteTestCase` (ahora usa `window.confirm`, igual que el resto del panel).

### 14.8 Bug de CSS preexistente — `@import` de fuente después de Tailwind

**[Cierto]** `frontend/src/index.css` tenía `@import "tailwindcss";` antes de `@import url(...fonts.googleapis.com...)`. Esto no lo introdujo ninguna de las dos rondas de esta sesión (confirmado con `git diff` contra el último commit: el orden ya era así) pero se detectó al observar los logs del contenedor `consulta-smart-frontend` en vivo: Vite reportaba `@import must precede all other statements` porque Tailwind v4 expande su propio `@import` en miles de líneas de utilidades, empujando el `@import` de la fuente fuera de la posición "primero en el archivo" que exige la especificación CSS. Se corrigió invirtiendo el orden (fuente primero, Tailwind después) — verificado en los logs del contenedor tras el cambio: la advertencia desapareció.

### 14.9 Tokens de diseño semánticos (Prioridad #4 del informe)

`frontend/src/index.css` agregó tokens `--color-success/warning/danger/info` (vía `@theme` de Tailwind v4) y sus equivalentes `--cs-*` con variantes light/dark, más utilidades `.cs-chip--{success,warning,danger,info}`. Reemplazan los colores Tailwind ad hoc (`emerald-600`, `blue-500/10`, etc.) que antes se elegían por archivo. Usados consistentemente en la barra de salud de indexado, las citas de fuente y los chips de estado.

### 14.10 Sandbox flotante roto por doble contenedor de scroll — corregido

**[Cierto]** El sandbox de prueba en vivo (`sticky top-6` dentro de la columna 3 del grid de `AdminPage.jsx`) dejaba de "flotar" al scrollear más allá de cierto punto. Causa raíz: `App.jsx` ya envuelve la página en `<main className="flex-1 h-full overflow-y-auto">` (el verdadero contenedor de scroll), pero `AdminPage.jsx` (y, se confirmó, también `DocumentsPage.jsx`, `DocumentationPage.jsx`, `ResultsPage.jsx`, `WidgetIntegrationPage.jsx`) repetía `overflow-y-auto` en su propio `<div>` raíz. Ese div nunca se desborda a sí mismo (crece libre dentro de `<main>`, sin altura propia acotada), por lo que nunca scrollea — pero por especificación CSS, declarar `overflow` distinto de `visible` en un ancestro lo convierte en el "contenedor de scroll" de referencia para `position: sticky` de sus descendientes, sin importar si ese ancestro realmente llega a desbordarse. El sandbox terminaba anclado a ese contenedor inerte en vez de a `<main>`, que es el que realmente se mueve. Se quitó el `overflow-y-auto` duplicado en las 5 páginas para dejar un único contenedor de scroll real y consistente.

Un segundo factor contribuyente (ya corregido antes de diagnosticar el bug de fondo): `PromptRegressionPanel` se había agregado inicialmente *debajo* del grid de 3 columnas en vez de dentro de la columna 1-2 — esto acortaba la fila del grid que determina hasta dónde puede "flotar" el sandbox. Se movió dentro de la columna del configurador; el fix real, sin embargo, fue el punto anterior (el `overflow-y-auto` duplicado).

### 14.11 Gestión de Configuración con bitácora y restauración (CMMI CM) — nuevo

**Incidente que motivó esto (2026-07-22):** un administrador corrompió el `system_prompt` del tema `general` (texto duplicado/autoreferencial por un uso incorrecto del generador de prompts). `chatbot_profiles` no tenía historial de cambios — se restauró el valor manualmente reconstruyéndolo desde el fallback hardcodeado en `chat_service.py`, la única fuente "de fábrica" disponible. Ver bitácora completa de causa raíz en `docs/BITACORA_ANALISIS_CAUSAL.md`.

**Corrección estructural aplicada (no solo el incidente puntual):**
- Nueva tabla `chatbot_profile_audit_log` (`ChatbotProfileAuditLogModel`): registra `action` (`create`/`update`/`delete`/`restore`), `changed_by_id`/`changed_by_email`, snapshot `before`/`after` (JSON, **sin** `custom_api_key`, ni siquiera cifrada — el historial no debe ser una superficie adicional de exposición de secretos), y `created_at`. Se crea automáticamente vía `create_all` al ser tabla nueva (sin necesidad de parche de esquema).
- `admin.py::save_chatbot_profile` y `delete_chatbot_profile` escriben una entrada de bitácora en la **misma transacción** que la mutación real (mismo commit o mismo rollback).
- `GET /admin/chatbot/profiles/{id}/audit-log` — historial completo de un tema.
- `POST /admin/chatbot/profiles/{id}/restore/{audit_log_id}` — restaura el tema al snapshot `after` de una entrada específica (no aplica a entradas `delete`, cuyo `after` es `NULL` por diseño); la propia restauración queda registrada como una nueva entrada (`action="restore"`), preservando la cadena completa de auditoría.
- `components/admin/ProfileAuditLogPanel.jsx` (nuevo, conectado en `AdminPage.jsx`): lista el historial del tema activo con botón "Restaurar" por entrada, con confirmación explícita.
- El tema `general`, además, ahora es de solo lectura a nivel de backend (rechaza `UPDATE`/`DELETE` con 400 si ya existe) — antes solo el frontend bloqueaba el borrado; un `DELETE` directo a la API lo hubiera eliminado igual.

**Evidencia [Cierto]:** prueba de extremo a extremo ejecutada contra el contenedor real (crear → editar → verificar historial → restaurar → verificar valor restaurado exacto → borrar → verificar entrada `delete` en el historial) — todas las aserciones pasaron. Ver `docs/BITACORA_ANALISIS_CAUSAL.md` para el detalle completo.

---

## 15. Tercera Ronda — Fuga de dominio RPP al fallback genérico y motor LLM completo por tema (2026-07-29)

Esta ronda respondió a tres observaciones del administrador (Israel) al revisar `/admin` → "Configuración de Chatbots & Temas": (1) el tema `general` devolvía el system_prompt del consultor RPP/IRCEP; (2) no era claro si el generador de System Prompt (§4) tomaba en cuenta los Tópicos Prohibidos ya configurados; (3) la configuración del motor LLM por tema tenía huecos (sin endpoint para Ollama, proveedores listados sin implementación real, modelos sugeridos desactualizados).

### 15.1 Causa raíz de la fuga RPP → `general` (reincidencia de §14.11)

**[Cierto] Hallazgo:** el fallback de `system_prompt` en `chat_service.py::process_query` — usado cuando un perfil no trae `system_prompt` propio en BD — era el texto **completo y específico** del consultor RPP/IRCEP (mención de "Notario", "Registro Público", TEMAS PROHIBIDOS de RPP, etc.), aplicado **incondicionalmente a cualquier `profile_id`**, no solo a `rpp`/`ircep`. Verificado por consulta directa contra la BD real: el perfil `general` tenía ese texto exacto (2209 caracteres, byte-a-byte idéntico al literal hardcodeado en `chat_service.py`) desde `2026-07-22 20:43:42` — es decir, la "restauración al valor de fábrica" documentada en §14.11 sí se ejecutó, pero el "valor de fábrica" que restauró (el propio fallback hardcodeado del código) **era en sí mismo el bug**: no era un valor genérico, era el prompt de un tenant específico. Efecto secundario no evidente: como el texto heredado contenía las palabras "rpp"/"registro público", la bandera `is_custom` (línea ~76-82 de `chat_service.py`) se evaluaba en `False` para el tema `general`, activando por error las heurísticas de jurisdicción y el query-rewriter específicos de RPP (`heuristics.apply_search_logic`, prompt de reescritura "Como experto RPP...") también para el chatbot genérico.

El mismo patrón de fuga de dominio existía, de forma más sutil, en dos defaults adicionales: la columna ORM `rejection_message` (`models.py`) y el DTO Pydantic `ChatbotProfileDTO.rejection_message`/`forbidden_topics` (`admin.py`) — ambos mencionaban "Registro Público" como si fuera universal. Este segundo default es alcanzable en producción: el modal "Nuevo Tema" del frontend (`newProfile` en `AdminPage.jsx`) no incluye `forbidden_topics` en su estado inicial, por lo que cualquier tema nuevo creado desde ahí heredaba silenciosamente el default RPP del DTO.

**Corrección aplicada:**
- `chat_service.py`: el fallback ahora es genérico — mantiene la misma estructura de 7 puntos (prioridad RAG, temas válidos, temas prohibidos, no conocimiento ajeno, tono, respuesta de rechazo, formato) pero sin vocabulario de ningún tenant específico. Los temas `rpp`/`ircep` no se ven afectados porque ya tienen su propio `system_prompt` real en BD (1216 y 927 caracteres respectivamente, verificados).
- `models.py` (columna ORM) y `admin.py` (`ChatbotProfileDTO`): mismos defaults corregidos a texto genérico; el default de `forbidden_topics` se amplía para incluir también los temas legal/académicos que antes solo vivían como texto libre dentro del prompt de RPP (demandas legales, cultura general, tesis académicas, redacción de documentos legales, asesoría jurídica personal) — así el filtro duro por substring (`chat_service.py`, evaluación de `forbidden_list`) queda alineado con lo que cualquier prompt genérico razonable declara como fuera de dominio.
- **Corrección de datos en la BD real** (autorizada explícitamente por el administrador): `UPDATE` directo sobre `chatbot_profiles WHERE id='general'`, fijando `system_prompt`/`forbidden_topics`/`rejection_message` a los nuevos valores genéricos. No existía una entrada en `chatbot_profile_audit_log` con snapshot `before` que restaurar (la corrupción es anterior a 2026-07-22 20:43:42, cuando esa tabla ya existía pero — según la introspección de la sesión — no quedó registro de este cambio puntual en ella). Se documenta aquí en vez de fabricar una entrada de auditoría sintética: esa tabla asume `changed_by_email` de un usuario autenticado real, y escribir un email inventado (aun con una nota aclaratoria) socava la garantía de trazabilidad que la tabla existe para dar.

**Lección para el diseño de fallbacks:** un valor "por defecto" en código de aplicación nunca debe contener vocabulario de un dominio/tenant específico, aunque ese tenant sea el caso de uso original del sistema. Un fallback debe ser genérico o, si no puede serlo razonablemente, forzar configuración explícita (fallar de forma visible) en vez de heredar contenido ajeno en silencio.

### 15.2 Guardrails del generador de System Prompt (§4.4/§4.6 del manual de usuario)

**[Cierto] Hallazgo:** `POST /admin/generate-prompt` no recibía `forbidden_topics` ni `rejection_message` — el LLM redactaba genéricamente "temas prohibidos" sin ver lo que el administrador ya había configurado en la sección de Guardrails, por lo que el System Prompt generado podía terminar sin alinearse con el filtro duro real. Se agregó `forbidden_topics`/`rejection_message` a `PromptGenerateRequest` (`admin.py`) y se construye un bloque de "7 puntos obligatorios" (mismo patrón que §15.1) que se anexa a la instrucción de meta-prompting de las tres metodologías (CRAFT/CREA/ASPECCT), exigiendo que el LLM reutilice explícitamente los tópicos y el mensaje ya capturados en vez de inventar otros. El frontend (`AdminPage.jsx::handleGeneratePrompt`) envía ambos campos desde el estado `config` ya cargado en pantalla.

Adicionalmente, en el frontend se reubicó la tarjeta de Guardrails (antes al final del formulario "Parámetros del Tema") a inmediatamente debajo del textarea del System Prompt generado, dentro de la misma tarjeta — sin cambios de comportamiento, solo de disposición visual, para que ambos mecanismos (instrucción blanda en el prompt + filtro duro por substring) se revisen juntos.

### 15.3 Motor LLM por tema — proveedores incompletos y bug de `system` prompt ignorado

**[Cierto] Hallazgo #1 — proveedores fantasma:** el selector de "Proveedor de IA" en `AdminPage.jsx` ofrecía `anthropic`, `mistral` y `ollama`, pero `SmartLLMRouter._init_custom_provider` no tenía ninguna rama para esos tres valores — caían en el `else` que lanza `ValueError`, capturado por el `try/except` de `chat_service.py` (mismo patrón de "fallo silencioso" ya documentado en §14.5 para el bug original de ese mismo método), degradando siempre al router global sin ningún aviso visible para el administrador. Se implementaron `OllamaProvider`, `MistralProvider` y `AnthropicProvider` en `llm_service.py` (reutilizando el SDK `openai` ya declarado en `requirements.txt` para Ollama/Mistral, vía sus endpoints OpenAI-compatibles, y el SDK `anthropic` — ya en `requirements.txt` desde antes pero nunca usado) y se conectaron en `_init_custom_provider`. `vertex` se retiró del selector por tema: usa credenciales de proyecto GCP, no una API key simple, y solo tiene sentido como motor global (`GCP_PROJECT_ID`).

**[Cierto] Hallazgo #2 — el `system` prompt se perdía en 3 de los 7 proveedores:** `GroqProvider.chat`, `NvidiaNimProvider.chat` y `_OpenAICompatibleProvider.chat` (override `openai`) recibían el kwarg `system` pero **nunca lo usaban** al construir la llamada al proveedor — ningún guardrail, ninguna instrucción del System Prompt llegaba efectivamente al modelo para cualquier tema configurado con esos tres motores, sin ninguna excepción ni log de error (el proveedor simplemente respondía sin contexto de sistema). Gemini/Vertex no tenían el bug porque usan `system_instruction` nativo del SDK en vez de un mensaje `role: system` inyectado a mano. Se agregó el helper `_with_system(messages, system)` en `llm_service.py` y se aplicó en los tres proveedores afectados y en los tres nuevos.

**Nueva columna `chatbot_profiles.custom_base_url`** (`VARCHAR(255)`, nullable): obligatoria para `ollama` (endpoint del servidor, ej. `http://ollama-host:11434`; Ollama no tiene URL pública única) y opcional para `openai`/`nvidia`/`mistral` (gateway o proxy propio). Aplicada en vivo con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` y agregada a `_SCHEMA_PATCHES` en `database.py` (ver §14.6/MIG-01 sobre por qué este paso es obligatorio en este proyecto, que no usa Alembic).

### 15.4 Catálogo de modelos en vivo — reemplazo de la lista estática

**[Cierto] Hallazgo:** el `<datalist>` de modelos sugeridos en `AdminPage.jsx` estaba desactualizado — por ejemplo sugería `meta/llama-3.1-70b-instruct` para NVIDIA NIM mientras el propio default global `NVIDIA_NIM_MODEL` en `config.py` ya usaba `meta/llama-3.3-70b-instruct`. Una lista hardcodeada de modelos nunca se mantiene sincronizada con la realidad de cada proveedor (que libera/descontinúa modelos sin avisar a este repositorio). Se reemplazó por `POST /api/v1/admin/llm/list-models`, que consulta el catálogo real vía la API de cada proveedor en el momento: `client.models.list()` para Groq/OpenAI/Mistral (SDK `openai`, distintos `base_url`) y Anthropic (SDK `anthropic`); `GET v1beta/models` (REST) para Gemini; `GET /api/tags` para Ollama. Acepta `profile_id` para descifrar y reutilizar la `custom_api_key` ya guardada de un tema existente sin tener que volver a escribirla. El frontend expone un botón "Cargar modelos disponibles" junto al campo de modelo, que llena el `<datalist>` dinámicamente y muestra el error del proveedor si la consulta falla (sin bloquear que el administrador escriba el modelo a mano).

**Verificado [Cierto]:** sintaxis de todos los módulos backend validada (`ast.parse`), ruta `/api/v1/admin/llm/list-models` confirmada registrada vía `openapi.json` del contenedor real tras reinicio, columna `custom_base_url` confirmada en `information_schema.columns` de la BD real, y HMR de Vite confirmó JSX válido en `AdminPage.jsx` (sin prueba end-to-end con credenciales reales de cada proveedor — pendiente, ver `.agent/STATE.md`).

---

## 16. Cuarta Ronda — Auditoría Técnica Integral (2026-07-29)

Auditoría ejecutada siguiendo la metodología de `SKILL_AUDITORIA_SISTEMAS_COMPLETA.md` y `ESTANDARES_AUDITORIA.md` del repositorio (6 capas: BD/Persistencia, Backend API, Frontend, Seguridad, Infraestructura/DevOps, Testing/QA), adaptada al stack real de este proyecto (FastAPI + SQLAlchemy Async + PostgreSQL/pgvector + React/Vite — no Java/Spring ni Angular, por lo que los ítems específicos de esos stacks no aplican). Verificación contra el código real y, donde fue posible, contra el contenedor `consulta-smart-backend` y el proxy `casmarts-core-proxy` en ejecución.

### 16.1 Resumen ejecutivo

| Severidad | Hallazgos | Corregidos (16.2 + 16.6) | Documentados (diferidos) |
|---|---|---|---|
| 🔴 Crítica | 0 | — | — |
| 🟠 Alta | 2 | 2 | 0 |
| 🟡 Media | 5 | 4 | 1 (SEC-TLS-001, bloqueado por certificado externo) |
| 🟢 Baja | 3 | 0 | 3 (aceptadas, sin acción) |

No se encontraron hallazgos Críticos nuevos. Los hallazgos Críticos/Altos de rondas anteriores (§8, §14, §15) siguen remediados y no presentaron regresión. Los 4 hallazgos Media que en la publicación original de esta sección quedaron "documentados y diferidos" (§16.3) se cerraron en una pasada de seguimiento el mismo día — ver §16.6.

### 16.2 Hallazgos corregidos esta ronda

**[SEC-HEADERS-001] Alta — Sin cabeceras de seguridad HTTP en el proxy público**
- **Componente:** `nginx/conf.d/chat.casmart.internal.conf` (proxy `casmarts-core-proxy`, único punto de entrada público de la app).
- **Evidencia:** `curl -I https://chat.casmart.internal/` no devolvía `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` ni ninguna protección de framing — el vhost solo tenía `proxy_pass` sin `add_header`.
- **Corrección:** se agregaron `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` y `Referrer-Policy` a nivel del `server {}` (aplican a `/`, `/api/` y `/admin`). **Deliberadamente NO** se aplicó `X-Frame-Options`/CSP `frame-ancestors` de forma global: el widget embebible (`WidgetIntegrationPage.jsx`) depende de poder incrustarse en sitios de terceros — es la misma razón de diseño por la que `CORS_ORIGINS` es `*` en el backend (con `allow_credentials=False`, ver `main.py`). En su lugar, se creó un `location /admin` dedicado con `X-Frame-Options: SAMEORIGIN` y `Content-Security-Policy: frame-ancestors 'self'`, ya que el panel de administración es el único punto que nunca debe poder embeberse. **Verificado [Cierto]:** `curl -I` contra el proxy real tras `nginx -s reload` confirma las cabeceras en `/` y `/api/`, y `X-Frame-Options`/CSP específicamente en `/admin`.

**[PERF-GZIP-001] Alta — Compresión HTTP inactiva para el tráfico real de la app**
- **Componente:** mismo vhost. `nginx.conf` global tiene `gzip on;` pero sin `gzip_types` explícito — el default compilado de nginx solo cubre `text/html`, por lo que el JSON de la API y el JS/CSS del bundle de Vite (la inmensa mayoría del tráfico real) viajaban sin comprimir pese a que `gzip` aparentaba estar activo.
- **Corrección:** se agregó `gzip_types` (json, javascript, css, texto plano, svg) y `gzip_min_length 512` al vhost de consulta-smart. **Verificado [Cierto]:** `curl -H "Accept-Encoding: gzip"` contra `/api/v1/admin/chatbot/profiles` real ahora responde `Content-Encoding: gzip`.

**[SEC-ERROR-001] Media — Mensajes de excepción interna expuestos al cliente**
- **Componente:** `app/routes/chat.py` (7 endpoints) y `app/routes/search.py` (1 endpoint).
- **Evidencia:** patrón repetido `except Exception as e: logger.error(...); raise HTTPException(status_code=500, detail=str(e))` — el detalle real ya se registraba correctamente en logs (server-side), pero el mismo texto se reenviaba también al cliente en el body de la respuesta 500, pudiendo exponer mensajes de SQLAlchemy/librerías internas, nombres de tabla o rutas de archivo ante un error inesperado.
- **Corrección:** se reemplazó `detail=str(e)` por mensajes genéricos y accionables por endpoint (ej. `"No se pudo procesar la consulta. Intenta de nuevo en unos momentos."`), sin tocar el logging server-side (que conserva el detalle real para diagnóstico). **Verificado [Cierto]:** `grep -rn "detail=str(e)"` sobre ambos archivos post-cambio no arroja resultados; sintaxis validada con `ast.parse`.

### 16.3 Hallazgos documentados (no corregidos esta ronda) — con justificación

> **Actualización (mismo día, pasada de seguimiento):** PERF-INGEST-001, DB-RACE-001 y
> TEST-001 se corrigieron horas después de escribir esta sección — ver §16.6. Se conserva la
> tabla original tal cual se escribió (incluida la justificación de por qué se difirieron en
> ese momento) como registro histórico de la decisión; solo SEC-TLS-001 sigue diferido.

| ID | Severidad | Hallazgo | Componente | Por qué se difirió en el momento de escribir esta sección |
|---|---|---|---|---|
| SEC-TLS-001 | Media | Verificación TLS deshabilitada (`ssl.CERT_NONE`) al validar el JWKS de Authentik — riesgo de MITM interno | `app/core/auth_utils.py` | **Ya documentado y triado en una ronda anterior** (comentario en código + `logger.warning` en cada arranque). El fix correcto (confiar en la CA real de `auth.casmart.internal` en vez de desactivar la verificación) requiere el certificado de esa CA, que vive en la gestión de identidad (`casmarts-idp-*`), fuera del alcance de este repositorio. Se confirmó que sigue activo en runtime (`AUTHENTIK_INTERNAL_URL=https://auth.casmart.internal` real). No se re-diagnosticó ni se tocó código: la documentación existente ya es correcta y accionable. |
| PERF-INGEST-001 | Media | Ingesta de documentos genera embeddings y persiste chunks de forma secuencial, un `flush()` de BD por chunk (`document_usecases.py`, bucle `for chunk_num, chunk_text in chunks`) | `app/application/usecases/document_usecases.py`, `app/infrastructure/repositories/vector_store.py` | Coincide con el patrón "Operaciones Iterativas (No-Batch)" de la skill de auditoría. El fix (remover el `flush()` por ítem y hacer un único flush al final del bucle) es seguro en teoría (`autoflush=False` en la sesión, ver `database.py`) pero toca 3 puntos de llamada (`auto_ingest_service.py`, `routes/documents.py`, `document_usecases.py`) del pipeline de ingesta real (Docling + SeaweedFS + embeddings), que requiere una prueba end-to-end de subida de documento real antes de aplicarse — no se ejecutó en esta ronda por alcance de tiempo. |
| DB-RACE-001 | Media | Sin control de concurrencia optimista (`version`/`row_version`) en `chatbot_profiles` — dos administradores editando el mismo tema al mismo tiempo pueden pisarse cambios sin aviso (last-write-wins silencioso) | `app/infrastructure/models.py`, `app/routes/admin.py::save_chatbot_profile` | Riesgo real pero de baja probabilidad dado el volumen esperado de administradores concurrentes en este panel interno. Implementarlo correctamente requiere: columna `version` nueva + parche de esquema, lógica de rechazo en `save_chatbot_profile`, y que el frontend cargue/reenvíe la versión en cada guardado — cambio de tres capas que amerita su propio ciclo de prueba, no un fix apurado al final de una auditoría ya extensa. |
| TEST-001 | Media | Cobertura de pruebas del frontend = 0 (`frontend/src` no tiene ningún `*.test.*`/`*.spec.*`), incluyendo el código nuevo de la Tercera Ronda (§15: nuevos proveedores LLM, endpoint de catálogo de modelos) | `frontend/src/**` | El backend sí tiene una suite (`tests/`, `tests/integration/`) razonable. Construir una suite de pruebas de frontend desde cero es un esfuerzo de alcance propio (Alto, según la propia plantilla de esfuerzo de la skill), no algo que deba improvisarse al cierre de esta sesión. |

### 16.4 Hallazgos revisados sin acción (aceptados o ya mitigados)

| Área | Verificación | Conclusión |
|---|---|---|
| CORS `origins=*` (`main.py`) | Revisado contra el código: `allow_credentials=False` se fuerza automáticamente cuando hay wildcard | Diseño intencional para el widget embebible en sitios de terceros; no vulnerable a robo de sesión vía CORS porque no viajan credenciales/cookies con el wildcard activo. |
| SQL con `f"""..."""` en `knowledge_base.py` (búsqueda léxica) | Inspección línea por línea: el f-string solo ensambla fragmentos `WHERE` fijos de una lista blanca (`filter_clauses`); todos los valores reales viajan como bind params (`:query_str`, `:category`, `:keyword_N`) | No vulnerable a SQL injection — parametrización correcta pese a la apariencia superficial de concatenación. |
| Autorización en `admin.py` (19 endpoints mutantes/sensibles) | Verificación exhaustiva de cada firma de función | 100% de cobertura de `Depends(require_admin)`; el único endpoint sin auth (`GET /chatbot/profiles`) es público por diseño y ya devuelve un DTO sanitizado (§7). |
| IDOR en sesiones/mensajes de chat (`chat.py`) | Verificado: 4 puntos distintos comparan `session.user_id == current_user["id"]` | Ya corregido en la ronda del 2026-07-22 (§14.3); sin regresión. |
| Rate limiting en endpoints costosos | `POST /chat/query` (30/60), `/admin/generate-prompt` (10/60), `/admin/llm/list-models` (15/60), `/admin/chatbot/documents/upload` (5/60) | Cobertura adecuada en los endpoints que invocan LLMs o procesan archivos. |
| `<img>` sin `loading="lazy"` (4 ocurrencias) | Todas son logos "above the fold" (nav, login, header del chat) | Correcto no aplicar lazy loading ahí — hacerlo perjudicaría el LCP en vez de mejorarlo. |
| `setTimeout` sin `clearTimeout` explícito (3 componentes) | Todos son timers de un solo disparo de 2-4s para limpiar mensajes de éxito transitorios ("Copiado", estado de reindexado) | Sin `setInterval` alguno en todo el frontend (sin riesgo de fuga recurrente); peor caso es una advertencia de consola si el componente se desmonta en esa ventana de 2-4s, no una fuga de memoria persistente. |
| Contraseñas y JWT (`auth_utils.py`) | `bcrypt` vía `passlib`, JWT con `exp` + `verify_exp=True`, `min_length=8` en DTOs de password | Correcto. Sin formulario de login local propio (SSO vía Authentik) — fuerza bruta de login queda delegada a Authentik, fuera del alcance de este repositorio. |
| `custom_api_key` en `chatbot_profiles` | Cifrado con Fernet (`app/core/crypto.py`), enmascarado en respuestas API, excluido de los snapshots de auditoría | Correcto (ya remediado en §14.5). |

### 16.5 Dependencias — `npm audit` (frontend)

`react-router-dom@6.30.4` (vía `react-router@6.30.4`) tiene 2 CVEs de severidad moderada (open redirect en `<Link>`/`useNavigate`, e inyección de constructor arbitraria en hidratación SSR — esta segunda no aplica directamente porque el proyecto es un SPA de solo cliente, no SSR). `npm audit fix` no pudo aplicarse en caliente: existe un conflicto de peer-dependencies **preexistente** entre `lucide-react@0.344.0` (declara soporte hasta React 18) y `react@19.2.7` (ya instalado). Se recomienda resolver ambos juntos (actualizar `lucide-react` o forzar con `--legacy-peer-deps`) en un ciclo de desarrollo con build y prueba manual completos, no como parche en caliente contra el contenedor en ejecución.

**Actualización (misma sesión, pasada de seguimiento):** se cerró el conflicto de peer-deps actualizando `lucide-react` a `^1.27.0` (declara soporte para React 19), y `npm audit fix` resolvió el CVE alto de `postcss` (path traversal en auto-carga de sourcemaps). Quedan pendientes, ahora ya sin bloqueo de peer-deps pero requiriendo un bump de versión mayor con prueba manual: `react-router-dom` (6→7, rompe API de data-loading) y `vite`/`esbuild` (5→8, ver hallazgo VITE-DEV-001 abajo). Ninguno de los dos se forzó en esta sesión — son cambios de infraestructura de ruteo/build, no parches de un endpoint aislado.

### 16.6 Cierre de hallazgos diferidos (misma sesión, pasada de seguimiento)

El usuario pidió explícitamente aplicar las correcciones que §16.3 había dejado documentadas pero sin aplicar. Se cerraron 4 de las 5 (todas menos SEC-TLS-001, genuinamente bloqueado — ver arriba).

**PERF-INGEST-001 — corregido.** Se reemplazó el patrón "un embedding por chunk, secuencial" por `LocalEmbeddingService.embed_batch()` (ya existía en el código, nunca se usaba) en los 4 puntos reales de ingesta: `admin.py::upload_chatbot_document` (ruta real de subida desde el panel), `admin.py::reindex_chatbot_document`, `routes/documents.py::load_rpp_registry`, y `auto_ingest_service.py` (el watcher de carpeta, activo en producción). Se preservó la tolerancia a fallo parcial (si el lote completo de embeddings falla, los chunks se guardan con `embedding=None` en vez de tumbar la subida, igual que antes).

Al revisar estos 4 puntos se encontraron dos hallazgos adicionales, no buscados pero corregidos de paso:
- **`auto_ingest_service.py` y `routes/documents.py::load_rpp_registry` obtenían el servicio de embeddings vía `get_llm_provider()`** (un provider de chat: Groq/Vertex/NVIDIA/Gemini según configuración) **en vez de `get_local_embedding_service()` directamente.** Funcionaba porque los 4 providers de chat delegan su `.embed()` al mismo servicio local internamente, pero ninguno expone `embed_batch()` — usar `get_llm_provider()` habría hecho fallar el batching con `AttributeError`. Se corrigió el import en ambos archivos.
- **`app/application/usecases/document_usecases.py::ProcessDocumentUseCase.execute()` (la ruta de Celery, `process_document_task`) estaba rota en dos puntos independientes**, ninguno detectado antes porque los workers de Celery llevan 4 días detenidos (`docker ps -a`: `Exited (0)`): llamaba a `self.llm_service.create_embedding(...)`, método que no existe en ningún provider (el correcto es `.embed()`/`embed_batch()`); y llamaba a `vector_store.add(..., text=chunk_text, ...)` con un kwarg que no existe en la firma real (`text_content`). Se corrigieron ambos y se aplicó el mismo batching. **No se investigó ni se tocó** por qué los workers de Celery están detenidos, ni se reiniciaron — eso es una decisión operativa fuera del alcance de un fix de código, y podría incluso haber sido intencional si alguien más ya sabía que esta ruta estaba rota.

**DB-RACE-001 — corregido.** Nueva columna `chatbot_profiles.version` (INTEGER, default 1; aplicada en vivo y agregada a `_SCHEMA_PATCHES`). `admin.py::save_chatbot_profile` ahora compara `data.version` (lo que el cliente cargó) contra `profile.version` (lo que hay en BD) antes de aplicar un UPDATE; si no coinciden, responde `409 Conflict` con un mensaje explicando que otro administrador ya guardó cambios, en vez de sobreescribir en silencio. La versión se incrementa en cada guardado exitoso y se expone en `admin-list`, `_snapshot_profile` y la respuesta de guardado. El check es opcional (`data.version: Optional[int]`) para no romper clientes/integraciones que aún no lo envíen. `AdminPage.jsx` carga la versión al seleccionar un tema, la reenvía al guardar, actualiza su copia local con la versión devuelta tras un guardado exitoso, y muestra el mensaje de conflicto tal cual si el backend responde 409.

**TEST-001 — corregido parcialmente, con hallazgo importante.** Al buscar pruebas de frontend se había buscado solo en `frontend/src/**` (0 resultados) sin revisar que el proyecto ya tenía un directorio `frontend/tests/` completo (7 archivos, `tests/setup.ts` con MSW + mocks de `localStorage`/`matchMedia`, un `README.md` que documenta "100+ tests, ~60-70% cobertura") — **nunca se había podido ejecutar** porque faltaban las dependencias (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `jsdom`) y `vite.config.js` no tenía la sección `test`. Se instalaron las dependencias faltantes y se conectó `setupFiles: ['./tests/setup.ts']`.

Al lograr que la suite corriera por primera vez, se encontró que **`tests/stores/Stores.test.js` (539 líneas, las pruebas de `authStore`/`chatStore`/`documentStore`) no probaba nada real**: redefinía cada store completo como `vi.fn(() => ({ ...forma falsa... }))` en vez de importar `src/stores/*.js` — las aserciones pasaban sin ejecutar una sola línea del código real. Se reescribió el archivo importando los stores reales, incluyendo una prueba de regresión explícita para el backdoor de escalación de privilegios ya documentado y eliminado en `authStore.js` (verifica que `login()` nunca asigna rol `admin` por contener esa palabra en el email/username, solo cuando `authAPI.me()` lo confirma).

Estado tras esta pasada: **63 pruebas se ejecutan, 34 pasan genuinamente** (incluyendo las 15 reescritas de `Stores.test.js` y los tests de componentes/páginas que sí montaban componentes reales). Las 29 que siguen fallando son manejadores de MSW faltantes en `tests/setup.ts` para varios endpoints (`/auth/register`, `/auth/refresh`, `/documents/{id}` GET/DELETE, `/chat/sessions/{id}/messages`, variantes de `/search`) y 2 aserciones de `API.test.js` que asumen que el handler compartido de `/auth/login` puede devolver error (necesitan `mswServer.use(...)` con un override por test), más una consulta de DOM en `SearchResults.test.jsx` que no encuentra el texto esperado — no se investigaron a fondo por alcance de tiempo; quedan como pendiente explícito (ver `.agent/STATE.md`).

**Hallazgo adicional, no buscado — VITE-DEV-001 [Media, documentado, no corregido]:** al investigar por qué `npm audit` reportaba el CVE de `esbuild` como "solo afecta al dev server" se confirmó que **el contenedor `consulta-smart-frontend` corre `vite dev` en lo que se presenta como producción** (`Dockerfile`: `CMD ["npm", "run", "dev", "--", "--host"]`, sin `vite build` ni servidor estático de por medio). Esto vuelve directamente relevante el CVE de esbuild (el dev server acepta requests de cualquier origen y puede leer la respuesta) y significa que el bundle servido nunca pasa por las optimizaciones de una build de producción real. Convertir esto a `vite build` + servir estático es un cambio de infraestructura de despliegue con riesgo real de romper el enrutamiento SPA o la inyección de variables de entorno si no se hace con cuidado — no se aplicó sin confirmación explícita; queda documentado como pendiente de mayor prioridad que los demás hallazgos Media de esta ronda.

---

## 17. Quinta Ronda — Incidentes de disponibilidad y auth (2026-08-04 / 2026-08-12)

### 17.1 Colisión de `preferred_username` de Authentik — 500 en cascada en todo el panel admin (2026-08-04)

**Síntoma:** consola del navegador con 500 en `/auth/me`, `/admin/users`, `/admin/chatbot/profiles/admin-list`, bitácora de auditoría, casos de regresión y creación de temas — prácticamente todo el panel `/admin` inoperante a la vez.

**Causa raíz:** `get_current_user` (`app/core/auth_utils.py`) auto-registra usuarios nuevos de Authentik usando el claim `preferred_username` del JWT como `username` local único, sin verificar colisión antes de insertar. Authentik entregó `preferred_username="admin_starter"` a dos cuentas reales distintas, violando el índice único `ix_users_username` con un `IntegrityError` sin manejar. Como `get_current_user` es la dependencia de autenticación de prácticamente todo endpoint protegido (`require_admin` la envuelve), el fallo tumbaba con 500 cualquier request de ese usuario, en cualquier endpoint.

**Corrección:** antes de insertar, se verifica si el `username` ya existe y se desambigua con sufijo; el `commit()` captura `IntegrityError` como red de seguridad final (rollback + reintento de búsqueda por email). La causa raíz real — por qué Authentik entrega el mismo `preferred_username` a cuentas distintas — vive en la configuración de `auth.casmart.internal`, fuera de este repositorio; no existe ningún token de administración de Authentik en los `.env` de este monorepo (solo credenciales de cliente OIDC, que no sirven para administrar Authentik). Queda documentado como pendiente explícito, no corregido, por decisión del admin.

**Hallazgo adyacente:** Vault (`10.4.3.208:8200`, compartido por todo el portafolio) estaba sellado tras un re-init del mismo día. Se desselló, se actualizó `VAULT_TOKEN` en `consulta-smart/.env`, y se re-sembró `secret/data/consulta-smart` con los mismos valores ya vigentes por fallback local (`SECRET_KEY`, `JWT_SECRET`, `DB_PASSWORD`, `GROQ_API_KEY`, `WIDGET_PASSWORD`) — **sin rotarlos**, ya que rotar `SECRET_KEY` habría vuelto indescifrables las `custom_api_key` ya cifradas de temas existentes, y rotar `WIDGET_PASSWORD` requiere actualizar en paralelo su hash en BD. Rotación real queda pendiente como tarea aparte con su propia migración.

### 17.2 `consulta-smart-backend` muerto en silencio 2 días tras reinicio del host (2026-08-12)

**Síntoma:** el selector de "Tema Activo" en `/admin` aparecía completamente vacío, sin ninguna opción y sin ningún error 500 visible en la consola del navegador (a diferencia del incidente de §17.1).

**Causa raíz:** no era un bug de aplicación. El host completo se reinició el 2026-08-10T00:33:07Z (`casmarts-core-proxy` y `consulta-smart-backend` con idéntico `StartedAt`). En ese arranque, `init_db()` (`app/core/database.py`) intentó conectar una sola vez a Postgres externo (`10.4.3.208:5432`) antes de que la ruta de red del host estuviera lista, y falló (`OSError: [Errno 113] Connect call failed`). La excepción abortó el `lifespan` de FastAPI (`ERROR: Application startup failed. Exiting.`). Como el contenedor corre `uvicorn --reload`, el proceso *reloader* (PID 1, el que Docker supervisa) no muere cuando el worker falla su arranque — solo queda esperando un cambio de archivo para reintentar. `restart: always` de Docker nunca se disparó (PID 1 seguía "vivo"), y el contenedor quedó marcado `Up` en `docker ps` durante 2 días sin nada escuchando realmente en el puerto 8000. `nginx` (`casmarts-core-proxy`) devolvía 502 (`connect() failed: Connection refused`) en cada request a `/api/v1/*` — visible en los logs del proxy, no en los del backend (que no procesaba ninguna request).

**Corrección:** `init_db()` ahora reintenta la conexión inicial (`SELECT 1`) hasta 5 veces con 5s de espera entre intentos antes de abortar, cubriendo la ventana de arranque en la que la red del host aún no está lista tras un reinicio (contrato formal en `.agent/SPECS.md` → `[CS-009]`). Restart manual para recuperar el servicio de inmediato. Verificado: `/docs` → 200 (host y vía proxy interno); `/auth/me` y `/admin/chatbot/profiles/admin-list` sin token → 401 limpio. Revisados de paso `casmarts-idp-api/-worker`, `lexivault-backend/-worker` y `consulta-smart-frontend`: los 5 arrancaron sin problema en el mismo reinicio del host — el fallo fue específico a la ventana de conexión a Postgres de este servicio.

**Lección de diagnóstico:** `docker ps` mostrando `Up` no es evidencia de que el proceso esté sirviendo tráfico. Ante "todo falla sin ningún log de error en el backend", conviene revisar primero si el backend está genuinamente recibiendo requests (logs de acceso del proxy) antes de asumir que el silencio significa ausencia de problema.

---

## 18. Manual de Despliegue de SDK Widget Web

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

## 19. Firmas de Conformidad Técnica

| Elaboró e Implementó | Aprobó y Autorizó |
| :--- | :--- |
| **Israel Martínez Hernández**<br>*Líder de Arquitectura e Inteligencia Artificial*<br>_(auditoría y remediación de seguridad 2026-07-22 asistida por Claude; funcionalidades de la ronda de tarde con Google Antigravity; rondas del 2026-07-29, 2026-08-04 y 2026-08-12 asistidas por Claude)_ | **Yareth Mora Resendiz**<br>*Directora de Tecnología y Sistemas* |

### Control de versiones

| Versión | Fecha | Autor | Descripción del cambio |
|---|---|---|---|
| 2.5 | Julio 2026 | Israel Martínez Hernández | Edición profesional ampliada original |
| 3.0 | 2026-07-22 (mañana) | Claude (asistido) | Se incorpora: modelo de datos completo (todas las tablas), sección de autenticación/autorización real, matriz de auth por endpoint, rate limiting, auditoría de seguridad completa con hallazgos [Cierto] y su remediación aplicada en código, documentación colocalizada por módulo, y conformidad con `docs/skills/`. El contenido de arquitectura/auditoría que antes vivía incorrectamente en el manual de usuario `CA-CS-M-01` se consolidó aquí. |
| 3.1 | 2026-07-22 (tarde) | Claude (asistido) | Se documentan las funcionalidades de la segunda ronda (Google Antigravity): salud de indexado + reintento, regresión de prompts, feedback de usuario, retrieval híbrido, LLM personalizado por tema, observabilidad del router, tokens de diseño semánticos (§14). Se corrigen y documentan 4 hallazgos reales encontrados al verificar ese código contra el sistema en ejecución: columnas de BD faltantes en la tabla real (MIG-01), BOLA en el endpoint de feedback, `custom_api_key` en texto plano (ahora cifrada), y un bug de integración que dejaba completamente no-funcional el LLM personalizado por tema. |
| 3.2 | 2026-07-22 (noche) | Claude (asistido) | Incidente real: `system_prompt` del tema `general` corrompido por un uso incorrecto del generador de prompts — restaurado al valor de fábrica y documentado en `docs/BITACORA_ANALISIS_CAUSAL.md` (práctica CMMI CAR, §14.11 de este manual). Corrección estructural: nueva bitácora de cambios `chatbot_profile_audit_log` con restauración a un clic (CMMI CM, §14.11), tema `general` ahora de solo lectura a nivel de backend, y corrección del bug de fondo del sandbox flotante (doble contenedor de scroll, §14.10). Nace `docs/ESTANDAR_CMMI_UNIVERSAL.md` como estándar de portafolio. |
| 3.3 | 2026-07-22 (noche) | Claude (asistido) | Cierre de las dos brechas CMMI restantes identificadas: RSKM formalizado en `consulta-smart/docs/REGISTRO_DE_RIESGOS.md` (8 riesgos abiertos + 8 cerrados, con probabilidad/impacto/plan/disparador de revisión); RD/TS Nivel 3 cerrado con `docs/skills/generacion-servicios-fastapi/SKILL.md` y `docs/skills/generacion-componentes-react/SKILL.md` (equivalentes reales, no genéricos, a los skills Angular/PrimeNG existentes — cada regla extraída de un bug real de esta sesión). |
| 3.4 | 2026-07-29 | Claude (asistido) | Tercera ronda (§15): se corrige la causa raíz real de la fuga RPP→`general` (el "valor de fábrica" restaurado en 3.2 era en sí mismo el bug — un fallback de código específico de RPP aplicado universalmente) y se corrige el dato en la BD real; el generador de System Prompt ahora incorpora los Guardrails ya configurados (§15.2); se completa el motor LLM por tema (Ollama/Anthropic/Mistral implementados, antes solo listados en el selector; `vertex` retirado del override por tema; nueva columna `custom_base_url`) y se corrige un bug donde 3 de 7 proveedores ignoraban el `system` prompt en runtime (§15.3); se reemplaza la lista estática de modelos sugeridos por un catálogo consultado en vivo a cada proveedor (§15.4, endpoint `POST /admin/llm/list-models`). |
| 3.5 | 2026-07-29 | Claude (asistido) | Cuarta ronda (§16): auditoría técnica integral siguiendo `SKILL_AUDITORIA_SISTEMAS_COMPLETA.md`/`ESTANDARES_AUDITORIA.md` (6 capas). Corregidos: sin cabeceras de seguridad HTTP en el proxy público (HSTS/nosniff/Referrer-Policy globales + X-Frame-Options/CSP dedicado a `/admin`), compresión gzip inactiva para JSON/JS/CSS por falta de `gzip_types`, y mensajes de excepción interna expuestos al cliente en 8 endpoints de `chat.py`/`search.py`. Documentados y diferidos con justificación: TLS deshabilitado hacia el JWKS de Authentik (ya triado en ronda anterior, bloqueado por certificado externo), ingesta de documentos sin batching de embeddings/flush, ausencia de concurrencia optimista en `chatbot_profiles`, cobertura de pruebas de frontend en cero, y 2 CVEs moderados en `react-router-dom` (bloqueados por conflicto de peer-deps preexistente). Cero hallazgos Críticos nuevos; sin regresiones en lo ya remediado. |
| 3.6 | 2026-07-29 | Claude (asistido) | Cierre de 4 de los 5 hallazgos diferidos en 3.5 (§16.6): embeddings en lote en los 4 puntos reales de ingesta (2 bugs adicionales encontrados de paso: import equivocado en `auto_ingest_service.py`/`documents.py`, y la ruta de Celery `document_usecases.py` llamaba métodos inexistentes — corregida aunque los workers están detenidos); concurrencia optimista (`chatbot_profiles.version`, 409 en conflicto) en `save_chatbot_profile` y `AdminPage.jsx`; conflicto de peer-deps `lucide-react`/React 19 resuelto (habilitó fix del CVE alto de `postcss`); y la suite de pruebas de frontend — que existía completa en `frontend/tests/` pero nunca había podido ejecutar por dependencias faltantes — se dejó corriendo (63 pruebas, 34 pasan) tras reescribir `Stores.test.js`, que probaba una versión mockeada de sí mismo en vez del código real. Solo SEC-TLS-001 sigue diferido (bloqueado por certificado externo fuera de este repo). Hallazgo nuevo documentado sin corregir: VITE-DEV-001, el contenedor de frontend corre `vite dev` en producción en vez de una build real. |
| 3.7 | 2026-08-04 / 2026-08-12 | Claude (asistido) | Quinta ronda (§17), dos incidentes de disponibilidad reales: (§17.1) colisión de `preferred_username` de Authentik entre cuentas distintas tumbaba con 500 todo endpoint autenticado (`get_current_user` sin manejo de `IntegrityError` en el auto-registro) — corregido con desambiguación de username + captura de la excepción; causa raíz en la configuración de Authentik queda fuera de este repo y sin corregir por decisión explícita del admin. Vault (compartido por el portafolio) se encontró sellado tras un re-init y se re-sembró con los mismos secretos ya vigentes, sin rotarlos. (§17.2) `consulta-smart-backend` quedó muerto en silencio 2 días tras un reinicio del host: `init_db()` fallaba una sola vez si Postgres externo no estaba aún alcanzable al arrancar, y `uvicorn --reload` no reinicia el worker tras un fallo de arranque (solo ante cambios de archivo), por lo que `restart: always` de Docker nunca se disparó — corregido con retry con backoff (`[CS-009]`). |
| 3.8 | 2026-08-13 / 2026-08-14 | Claude (asistido) | Sexta ronda (§20), tenant Centinela-AI: generador de System Prompt neutralizado al dominio + insumos persistidos (§20.1); fallback offline determinista dejó de filtrarse al chat real (§20.2); caché híbrida conectada al flujo real con aislamiento por `namespace` de tenant (§20.3); OpenRouter/Cerebras agregados y luego removidos por falta de cuota utilizable de cuenta, timeout por-proveedor reducido de 45s a 15s (§20.4); duplicación de documentos al subir corregida + borrado agregado (§20.5); `widget.js` construido de cero + bug de login real dentro del iframe por `localStorage` compartido con el panel admin (§20.6); ícono/color de marca del admin nunca llegaban al chat real, biblioteca extraída a módulo compartido (§20.7); cadena de 3 bugs reales en una sola consulta de usuario — `to_tsquery` roto por puntuación, expiración de sesión async tras `rollback()`, y cierre obsoleto de React en el primer mensaje de una sesión nueva (§20.8). |
## 20. Sexta Ronda — Blindaje del chatbot Centinela-AI: generador de prompts, RAG, caché, cascada LLM y widget embebido (2026-08-13/14)

### Contexto de negocio

El admin dio de alta el tenant **Centinela-AI** (chatbot de un producto de seguridad/SOC-XDR, dominio ajeno a los trámites RPP/IRCEP que motivaron el diseño original de la plataforma) y, usándolo en producción, fue encontrando una cadena de problemas reales, uno detrás de otro.

### 20.1 Generador de System Prompt sesgado a "trámites" + LOV con defaults de RPP + insumos nunca persistidos

**Síntoma:** el prompt generado para Centinela-AI seguía hablando de "trámite o procedimiento exacto", "Registro de expediente oficial", "ventanillas digitales" — vocabulario de gobierno/RPP, no de un producto de ciberseguridad. Además, el selector de "Audiencia Objetivo" mostraba "Servidores Públicos / Empleados Internos" (sesgado a sector público) para un tema de empresa privada.

**Causa raíz (tres capas):**
1. Los 4 meta-prompts de metodología (CRAFT/ASPECCT/CREA + genérico) en `admin.py::generate_prompt` tenían un checklist hardcodeado con frases de trámites, repitiendo el nombre corto del tema (`topic`) hasta 5 veces sin una descripción funcional real que darle al LLM.
2. `AdminPage.jsx` inicializaba los campos de audiencia/organización/sector con `useState` a valores de fábrica de RPP, y el `useEffect` de auto-selección por perfil no tenía una rama `else` — al crear un perfil nuevo no catalogado, esos valores de RPP quedaban silenciosamente sin resetear.
3. Los insumos usados para generar el prompt (`topic`, `description`, audiencia, organización, sector) nunca se guardaban en BD — solo el resultado final (`system_prompt`), obligando a re-escribir todo desde cero para regenerar o ajustar un tema existente.

**Corrección:** meta-prompts reescritos en lenguaje neutral al dominio, derivando el contenido de una nueva `description` funcional (campo separado del `topic`); LOV sin default de tenant + rama `else` de reseteo; 5 columnas nuevas persistidas (`prompt_topic`, `prompt_description`, `prompt_target_audience`, `prompt_organization`, `prompt_sector`) en `chatbot_profiles`, cargadas/reenviadas por `AdminPage.jsx`. "Servidores Públicos / Empleados Internos" se separó en dos opciones (sector gobierno vs. personal interno de empresa privada).

### 20.2 Fallback offline determinista filtrándose como respuesta real de chat

**Síntoma:** con los proveedores LLM caídos, un usuario real preguntando algo sobre Centinela-AI recibía literalmente el texto de la plantilla CRAFT interna ("Eres el Consultor e Integrador Experto de Sistema de Atención y Consultas...") como si fuera la respuesta del asistente.

**Causa raíz:** un cambio previo había hecho que `SmartLLMRouter.chat()` degradara a esa plantilla determinista en vez de lanzar una excepción cuando ningún proveedor respondía — pensado únicamente para `admin.py::generate_prompt` (generador de prompts del panel admin), pero sin distinguir ese caso de una consulta de chat real.

**Corrección:** el fallback a plantilla ahora solo se activa si la llamada incluye la marca `topic` en sus kwargs (exclusiva del generador de prompts); en cualquier otro caso se relanza la excepción para que el manejador honesto ya existente en `chat_service.py` la capture y responda con un mensaje de error genérico, nunca con texto de plantilla.

### 20.3 Caché de respuestas (Redis + embeddings) nunca conectada al flujo real, y sin aislamiento por tenant

**Síntoma:** cada consulta, incluso repetida palabra por palabra, pagaba el costo/latencia completo de RAG+LLM.

**Causa raíz:** `HybridCacheLayer` (Redis exacto + similitud semántica local) existía completo pero `chat_service.py::process_query` nunca la invocaba — código muerto, no un bug de lógica. Al conectarla se encontró un segundo problema: la clave de caché no tenía namespace por tenant, así que una respuesta cacheada de un tema podía en teoría filtrarse a otro tema con una pregunta similar/idéntica.

**Corrección:** caché conectada al inicio y al final de `process_query` (solo para consultas sin historial de conversación, para no servir una respuesta cacheada de una pregunta aislada a una continuación contextual); `namespace=profile_id` agregado a todas las funciones de `cache_layer.py` (`cache_consulta_rpp:{namespace}:{hash}`). Verificado con prueba real contra Redis: HIT en el mismo namespace, MISS en namespace distinto.

### 20.4 Expansión y reversión de proveedores LLM + reducción de timeout por proveedor

El admin aportó API keys nuevas de OpenRouter y Cerebras. Se agregaron `OpenRouterProvider`/`CerebrasProvider` (API compatible con OpenAI) a la cascada global de `SmartLLMRouter`. Probadas con una llamada REAL de chat-completion (no solo listado de modelos): ambas keys autenticaban correctamente, pero **las cuentas no tenían cuota utilizable** (OpenRouter: `429 free-models-per-day`; Cerebras: `402 Payment required`). Tras confirmar que ninguna de las dos podía servir tráfico real sin que el admin agregara billing, y por decisión explícita del admin, **ambos proveedores se removieron del código** (2026-08-14) — `smart_llm_router.py`, `llm_service.py` y `config.py` revertidos a la cascada de 4 proveedores (Groq, Vertex, NVIDIA, Gemini).

Efecto colateral real observado mientras los 2 proveedores nuevos estaban activos: un timeout por-proveedor de 45s (agregado en una ronda previa para otro bug de NVIDIA colgándose indefinidamente) permitía que una cascada de 2 proveedores lentos en secuencia sumara hasta ~79s reales medidos en logs — más que el timeout HTTP del cliente (60s), dejando el spinner del widget colgado sin respuesta ni error visible. Corregido reduciendo el timeout por-proveedor a 15.0s (este cambio se mantuvo tras remover OpenRouter/Cerebras, ya que sigue siendo válido para la cascada de 4 proveedores restante).

### 20.5 Documentos RAG: duplicación al subir + sin forma de borrar

`DocumentUpload.jsx` llamaba a un endpoint roto con el `FormData` envuelto dos veces, y simulaba el documento "subido" localmente en el store con un ID falso en vez de refrescar desde el backend — llevando al admin a re-subir el mismo archivo pensando que había fallado, duplicándolo de verdad en el índice. Corregido: sube directo al endpoint real (`admin/chatbot/documents/upload`) y refresca la lista real (`fetchDocs()`) tras el éxito. Se agregó borrado de documento en la UI (el endpoint backend ya existía). `documentStore.js::setDocuments` ampliado para aceptar forma funcional (`prev => ...`).

### 20.6 Widget embebible: construido de cero, y bug de login real dentro del iframe

`widget.js` estaba documentado pero el archivo real nunca existió (404 al intentar embeberlo). Se construyó: un FAB flotante vanilla-JS que inyecta un `<iframe>` apuntando a la propia ruta SPA `/widget` (reutilizando `WidgetPage.jsx`/`ChatInterface.jsx` ya probados, sin reempaquetar el chat por separado), leyendo `data-tenant-id`/`data-primary-color`/`data-title` del `<script>` tag.

**Incidente real:** el widget embebido mostraba la pantalla real de login de Authentik en vez de chat de invitado anónimo. Causa raíz doble: (1) `WidgetPage.jsx` solo llamaba `guestLogin()` si no había ya un token — pero el iframe comparte `localStorage` por same-origin con el panel admin, así que un token de admin de otra pestaña se colaba sin dar acceso real al contexto del iframe; (2) el interceptor de respuesta 401 global de `services/api.js` redirigía a `/login` incondicionalmente, incluso dentro del iframe, secuestrando la navegación del sitio de terceros que embebía el widget. Corregido: `WidgetPage.jsx` invoca `guestLogin()` siempre; el interceptor no redirige cuando `window.self !== window.top`.

### 20.7 Ícono y color de marca nunca usados por el chat real

El selector de íconos con nombre del admin (biblioteca de 12 íconos) guardaba `chatbot_profiles.icon` correctamente y el "Probador Sandbox" de vista previa del panel (un mockup separado, escrito aparte) lo mostraba bien — pero `ChatInterface.jsx` (el chat real, tanto de escritorio como el usado dentro del widget) ignoraba `profileConfig.icon` por completo y siempre mostraba un emoji genérico, sin tratamiento de color en el header del widget. Los dos árboles de UI habían divergido en silencio por no compartir código. Corregido extrayendo la biblioteca a `frontend/src/constants/chatIcons.js` (única fuente para `AdminPage.jsx` y `ChatInterface.jsx`); el header del widget ahora usa `profileConfig.primary_color` de fondo con una insignia de ícono/logo, igualando el mockup del Sandbox.

### 20.8 Tres bugs reales encadenados en una sola consulta de usuario: `to_tsquery` roto por puntuación, expiración de sesión async tras rollback, y cierre obsoleto de React

**Síntoma:** el usuario preguntó "¿Cómo calcula Centinela el Centinela Risk Score (CRS)?" desde el widget embebido en producción; el mensaje se limpió del input pero la UI quedó colgada indefinidamente en "Procesando consulta...".

**Causa raíz (tres bugs independientes, cada uno agravando al siguiente):**
1. **Backend — `knowledge_base.py::search_in_knowledge_text_async`:** el filtrado de stopwords ("¿", "?") solo eliminaba tokens que coincidían EXACTAMENTE con esos símbolos; no separaba puntuación pegada a una palabra (`"¿cómo"`, `"(crs)?"`). Esos tokens llegaban intactos a `to_tsquery`, que interpreta paréntesis como sintaxis de agrupación — `PostgresSyntaxError: syntax error in tsquery`.
2. **Backend — `chat_service.py::process_query`:** el manejador de esa excepción hace `await session.rollback()` para poder seguir usando la conexión (correcto y necesario), pero eso expira TODOS los objetos ya cargados en la sesión async, incluido `profile` (cargado minutos antes). El acceso posterior a `profile.llm_provider` (para resolver el motor LLM personalizado del tema) disparó un intento de recarga perezosa fuera del contexto async correcto, revirtiendo en `sqlalchemy.exc.MissingGreenlet` — un error interno confuso que tumbó el turno de chat completo con "Sistema de Emergencia" en vez de simplemente perder el contexto RAG de esa búsqueda.
3. **Frontend — `ChatInterface.jsx::sendMessage`:** independientemente de si el backend respondía bien o mal, el primer mensaje de una sesión de chat nueva (el caso típico del widget, que empieza sin `currentSessionId`) nunca aplicaba la respuesta ni apagaba el spinner. `currentSessionId` es un cierre de React (`useState`) capturado en el render que invocó `sendMessage`; `setCurrentSessionId(nuevoId)` no se refleja en esa misma ejecución. Las comprobaciones de después (`activeSessionId === currentSessionId`, pensadas para descartar una respuesta si el usuario cambió de sesión mientras la petición estaba en curso) comparaban el id nuevo contra el `null` capturado en el cierre — siempre falso para una sesión recién creada, dejando la respuesta sin aplicar y `setLoading(false)` sin ejecutarse jamás.

**Corrección:**
1. Cada palabra se limpia con una expresión regular Unicode (`\w`, conserva acentos/ñ) antes de compararla con las stopwords y unirla al patrón de `to_tsquery`, en vez de solo filtrar coincidencias exactas.
2. Los valores del motor LLM personalizado por tema (`llm_provider`, `llm_model`, `custom_api_key`, `custom_base_url`) se capturan como variables planas de Python inmediatamente después de cargar `profile`, antes de la búsqueda RAG que puede hacer rollback — evitando depender de que el objeto ORM siga "fresco" varios segundos después.
3. Se agregó una bandera local `isNewSession` en `sendMessage`, verdadera cuando la sesión se creó en esa misma llamada; las comprobaciones posteriores usan `isNewSession || activeSessionId === currentSessionId`, preservando la protección original contra respuestas obsoletas sin depender de un cierre que aún no se ha actualizado.

**Evidencia de verificación:** prueba real vía API (`POST /chat/query` con la consulta exacta reportada) devolvió una respuesta grounded citando la fuente correcta, sin error; logs del backend confirmaron ausencia de `PostgresSyntaxError`/`MissingGreenlet` en la misma consulta; prueba de regresión de frontend (`ChatInterfaceNewSessionSend.test.jsx`) reproduce el envío del primer mensaje de una sesión nueva y confirma que `setLoading(false)` y la respuesta del asistente se aplican correctamente — antes del fix, esa aserción habría fallado.

**Lección de diagnóstico:** un `session.rollback()` correcto para recuperar una transacción abortada tiene un efecto secundario real con `AsyncSession` — expira objetos ya cargados, y accederlos después fuera de un `await` directo falla con un error que no menciona la causa original (la sintaxis rota de `to_tsquery`). Cuando un error de infraestructura async parece "sin relación" con el síntoma reportado por el usuario, vale la pena revisar el log completo de la request, no solo la última excepción — la causa raíz suele estar unas líneas más arriba.

---
