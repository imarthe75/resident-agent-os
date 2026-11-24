---
name: backend-fastapi
description: "Rutas y servicios FastAPI (Python async, SQLAlchemy async, PostgreSQL): autorización por dependencia y por propiedad del recurso, DTOs que no filtran datos sensibles, secretos cifrados en reposo, límite de peticiones en operaciones costosas, bitácora de cambios de configuración, migraciones versionadas y manejo de errores sin silenciar. Úsala al crear o revisar endpoints, servicios o modelos de un backend FastAPI."
---

# Backend FastAPI

Complementa a `rules/python/` y `prevencion-hallazgos-seguridad-calidad` para backends **FastAPI + SQLAlchemy async + PostgreSQL**.

## 1. Autorización: una dependencia, nunca un `if` dentro de la ruta
- Cada ruta declara su requisito con una dependencia compartida (`Depends(get_current_user)`, `Depends(require_role("admin"))`).
  Repetir `if "admin" not in user["roles"]` en cada ruta termina en rutas que lo olvidan.
- **Propiedad del recurso (BOLA/IDOR):** si el recurso pertenece a un usuario o a una unidad, la consulta lo filtra; tener el id no basta.
```python
result = await db.execute(
    select(Mensaje).join(Sesion, Mensaje.sesion_id == Sesion.id)
    .where(Mensaje.id == mensaje_id, Sesion.usuario_id == str(usuario["id"]))
)
mensaje = result.scalars().first()
if not mensaje:
    raise HTTPException(status_code=404, detail="No encontrado")   # 404, no 403: no revela si existe
```

## 2. DTOs: nunca devolver el modelo ORM
- `response_model` explícito en cada ruta; para lo público, un DTO con solo los campos seguros.
- Secretos de terceros (API keys, tokens) nunca salen en claro, ni en un DTO de administración: se enmascaran (`"••••" + valor[-4:]`).
```python
class EntidadPublica(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    nombre: str

@router.get("/publico", response_model=list[EntidadPublica])
async def listar_publico(db: AsyncSession = Depends(get_session)):
    return (await db.execute(select(Entidad))).scalars().all()
```

## 3. Secretos guardados en la base
Una credencial de un tercero que el sistema debe guardar se **cifra antes de escribirla** (p. ej. Fernet con la llave en el gestor de
secretos, nunca en el código) y se descifra solo donde se usa. El descifrado acepta el valor legado sin cifrar mientras se migra.

## 4. Límite de peticiones en operaciones costosas
Llamadas a modelos de IA, carga y procesamiento de archivos, exportaciones: `dependencies=[Depends(rate_limit(n, segundos))]` con `n`
según el costo real. Si el contador es por proceso (no compartido entre workers), se documenta como limitación.

## 5. Configuración de negocio editable
Si un panel de administración edita configuración que costaría reconstruir, sus cambios quedan en una bitácora desde el inicio: quién,
cuándo, valor anterior y nuevo, **en la misma transacción** que el cambio y sin secretos. Los registros «por defecto» que no deben
sobrescribirse se bloquean en el backend, no solo en la interfaz.

## 6. Esquema: migraciones versionadas
`Base.metadata.create_all` solo crea tablas nuevas: **no agrega columnas** a una tabla existente. Todo cambio de esquema va en una
migración versionada (Alembic, `alembic revision -m "…"` + `upgrade head`), idempotente y revisada en el merge request.

## 7. Errores
- `404` no existe o no le pertenece al usuario; `400` regla de negocio violada; `401` sin sesión; `403` sin permiso; `409` duplicado o
  conflicto de versión.
- Un `except Exception` siempre registra la traza (`logger.exception(...)`) antes de responder `500`; nunca `except: pass` ni un valor por
  omisión que oculte la falla. El mensaje al cliente no incluye trazas ni SQL.

## 8. Pruebas
`pytest` con `httpx.AsyncClient` contra la app y una base desechable (contenedor o transacción con rollback); para cada ruta nueva: caso
feliz, 401 sin sesión, 403 con otro rol y 404 con un recurso de otro usuario.

## Checklist
- [ ] Autorización por dependencia y filtro de propiedad cuando el recurso es de alguien.
- [ ] `response_model` explícito; lo público con DTO propio; secretos enmascarados.
- [ ] Secretos de terceros cifrados en reposo; llave fuera del código.
- [ ] Límite de peticiones en operaciones costosas.
- [ ] Bitácora en configuración de negocio editable.
- [ ] Cambio de esquema en una migración versionada.
- [ ] Errores con su código y traza registrada; pruebas de 401/403/404.

## Reglas del escáner que esta skill evita
`AUTHZ-NO-METHOD-AUTHZ`, `POTENTIAL-IDOR-NO-OWNERSHIP-CHECK`, `HARDCODED-SECRET`, `STD-STRIDE-LOG-SENSITIVE-DATA`, `SWALLOWED-ERROR`,
`STACK-TRACE-EXPOSURE`, `SQL-INJECTION-CONCAT`. Corrección de cada una: `prevencion-hallazgos-seguridad-calidad`.
