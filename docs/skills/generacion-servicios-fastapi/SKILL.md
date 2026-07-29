---
skill: generacion-servicios-fastapi
description: Guía canónica para generar o extender rutas/servicios FastAPI (Python async) en proyectos del portafolio, siguiendo los patrones reales validados en consulta-smart (auth, DTOs, auditoría, rate limiting, esquema). Complemento de `generacion-servicios` (que es específico de Angular) para el stack Python/FastAPI.
---

# Skill: Generación de Rutas/Servicios FastAPI

## Alcance

Este skill aplica a proyectos con backend **FastAPI + SQLAlchemy Async + PostgreSQL**
(`consulta-smart` es la referencia; aplica también a `idp-smart`/`lexivault-ai` si
comparten stack). Los patrones aquí no son teóricos — cada uno fue validado
resolviendo un bug o hallazgo real durante la auditoría de `consulta-smart`
(2026-07-22); las citas de archivo:línea son de ese proyecto como referencia.

---

## 1. Autenticación y autorización — nunca reimplementar el chequeo inline

**Regla:** toda ruta que requiera rol admin usa `Depends(require_admin)`
(`app/core/auth_utils.py`). Toda ruta que requiera solo estar autenticado usa
`Depends(get_current_user)`. **Nunca** reimplementar
`if "admin" not in current_user.get("roles", [])` inline en la ruta — eso fue
exactamente el hallazgo AUTH-02/AUTH-01 real: el chequeo duplicado de forma
inconsistente en 6 puntos, y ausente en 7 endpoints.

```python
@router.post("/algo-sensible")
async def mutar_algo(
    data: AlgoDTO,
    db: AsyncSession = Depends(get_session),
    current_user: dict = Depends(require_admin)   # no Depends(get_current_user) + chequeo manual
):
    ...
```

**Regla BOLA:** si el recurso pertenece a un usuario (no es admin-only), verificar
propiedad con un `JOIN` explícito o comparación directa de `user_id`, nunca confiar
en que "si tiene el ID, es suyo". Patrón de referencia real (`chat.py`, feedback):

```python
result = await db.execute(
    select(ChatMessageModel)
    .join(ChatSessionModel, ChatMessageModel.session_id == ChatSessionModel.id)
    .where(
        ChatMessageModel.id == message_id,
        ChatSessionModel.user_id == str(current_user["id"]),
    )
)
msg = result.scalars().first()
if not msg:
    raise HTTPException(status_code=404, detail="Mensaje no encontrado")  # 404, no 403 — no reveles si existe
```

---

## 2. DTOs — separar lo público de lo sensible, nunca devolver el modelo ORM crudo

Si un endpoint es público (sin auth) porque lo consume un widget/selector embebible,
**no** devuelvas el modelo ORM completo — crea un DTO explícito con solo los campos
seguros (`response_model=List[MiDTOPublico]`). Hallazgo real evitado con esto:
`GET /admin/chatbot/profiles` devolvía `system_prompt`/guardrails/`custom_api_key` a
cualquier visitante anónimo antes de introducir `ChatbotProfilePublicDTO`.

```python
class MiEntidadPublicDTO(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    # solo lo que un visitante anónimo debe poder ver

@router.get("/publico", response_model=List[MiEntidadPublicDTO])
async def listar_publico(db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(MiEntidad))
    return result.scalars().all()  # el response_model filtra automáticamente
```

Para campos que son secretos (API keys, tokens de terceros): **nunca** devolverlos
en claro, ni en el DTO admin. Enmascarar (`"••••••••" + valor[-4:]`) y descifrar
solo en memoria justo para construir la máscara — ver `app/core/crypto.py` y su uso
en `admin.py::list_chatbot_profiles_admin`.

---

## 3. Secretos en columnas de BD — cifrar en reposo si el valor es un secreto real

Si un campo guarda una credencial real de un tercero (no un dato propio del
usuario), cifrarlo con `app/core/crypto.py` (`encrypt_secret`/`decrypt_secret`,
Fernet) antes de guardar, y descifrar solo en el punto exacto donde se usa (nunca
antes). Preservar compatibilidad hacia atrás: `decrypt_secret` debe devolver el
valor tal cual si no es un token Fernet válido (dato legado), no fallar.

---

## 4. Rate limiting en endpoints costosos

Cualquier endpoint que invoque un LLM o procese archivos debe llevar
`dependencies=[Depends(rate_limit(N, segundos))]` (`app/core/rate_limit.py`).
Elegir `N` según el costo real de la operación (ej. 30/60s para chat, 5/60s para
uploads). Documentar en el propio módulo la limitación conocida (contador
por-proceso, no compartido entre workers) — no ocultarla.

---

## 5. Gestión de configuración — auditar cambios a entidades de config de negocio

Si la entidad representa **configuración de negocio** editable desde un panel
admin (no datos transaccionales de usuario final), y su corrupción/pérdida sería
costosa de reconstruir manualmente, agregar una bitácora de auditoría desde el
principio — no esperar a que ocurra un incidente real como el del tema `general`
en `consulta-smart` (ver `docs/BITACORA_ANALISIS_CAUSAL.md`). Patrón de referencia:
`ChatbotProfileAuditLogModel` + `_snapshot_profile()`/`_log_profile_change()` en
`admin.py` — snapshot antes/después en la **misma transacción** que la mutación,
sin incluir secretos en el snapshot.

Si además existe un registro "plantilla"/"por defecto" que nunca debería
sobreescribirse en su lugar (como `general`), bloquearlo explícitamente en el
backend (no solo en el frontend):

```python
if data.id == "general" and profile is not None:
    raise HTTPException(status_code=400, detail="... es de solo lectura ...")
```

---

## 6. Migraciones de esquema — columnas nuevas en tablas existentes

Si el proyecto no usa Alembic (verificar: ¿existe `alembic.ini`? ¿carpeta
`migrations/`?), recordar que `Base.metadata.create_all` **solo crea tablas
nuevas**, nunca altera una tabla existente para agregarle una columna — esto causó
un error real de PostgreSQL en producción (`chat_messages.feedback_rating`
inexistente pese a estar en el modelo ORM). Si se agrega una columna a un modelo
cuya tabla ya existe en producción, agregar el patch correspondiente a
`_SCHEMA_PATCHES` en `app/core/database.py` (`ALTER TABLE ... ADD COLUMN IF NOT
EXISTS ...`, idempotente) — **no asumir que `create_all` la creará sola**.

---

## 7. Manejo de errores — nunca silenciar, distinguir tipos de fallo

- `HTTPException(404)` — el recurso no existe (o no le pertenece al usuario: no
  reveles la diferencia, ver §1).
- `HTTPException(400)` — el request es inválido por una regla de negocio (ej.
  intentar editar un registro de solo lectura).
- `HTTPException(403)` — autenticado pero sin el rol/permiso requerido.
- `try/except Exception` genérico: siempre `logger.error(...)` antes de convertir a
  `HTTPException(500)` — nunca un `except: pass` o un catch que devuelva un valor
  por defecto sin registrar qué falló realmente (ver catálogo de
  `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` §5.4).

---

## 8. Checklist antes de dar por terminada una ruta nueva

- [ ] ¿Usa `require_admin`/`get_current_user` en vez de reimplementar el chequeo?
- [ ] Si resuelve un objeto por ID que pertenece a un usuario, ¿verifica propiedad con JOIN/comparación explícita?
- [ ] Si es pública, ¿usa un DTO explícito que no filtre campos sensibles?
- [ ] Si guarda un secreto de terceros, ¿lo cifra antes de guardar?
- [ ] Si invoca LLM o procesa archivos, ¿tiene rate limiting?
- [ ] Si es configuración de negocio crítica, ¿tiene (o necesita) bitácora de auditoría?
- [ ] Si agrega columnas a una tabla ya existente en producción, ¿se agregó el schema patch correspondiente?
- [ ] ¿Se probó contra el sistema real (no solo lectura de código) antes de darla por terminada?
