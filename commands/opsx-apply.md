# /opsx-apply

**Origen:** Adaptado de [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)  
Ejecuta las tareas de un cambio aprobado, siguiendo el `tasks.md` como guía canónica.

## Uso

```
/opsx-apply
/opsx-apply changes/2026-06-17-agregar-jwt-reportes/
```

Sin argumento, detecta el cambio activo (el único con `tasks.md` sin completar).

## Qué hace

1. Lee `changes/<cambio>/tasks.md` y `changes/<cambio>/spec.md`.
2. Ejecuta cada tarea en orden:
   - Marca `[ ]` → `[x]` al completar cada ítem
   - Aplica el skill **test-driven-development** (RED-GREEN-REFACTOR) en cada tarea de código
   - Ejecuta el skill **verification-before-completion** antes de marcar cada tarea completa
3. Al terminar todas las tareas: propone `/opsx-verify`

## Reglas durante la ejecución

- **Una tarea a la vez**: no avanzar a la siguiente sin verificar la actual
- **Respetar el spec**: si una tarea requeriría violar `spec.md`, detener y notificar
- **Limit ECC**: máximo 3 intentos por tarea; al cuarto → halt y reportar en `tasks.md`
- **No improvisar**: si algo no está en `tasks.md` pero se descubre necesario, agregar al final con nota

## Formato de tasks.md

```markdown
# Tasks: [Nombre del Cambio]
**Cambio:** changes/YYYY-MM-DD-nombre/
**Estado:** EN PROGRESO | COMPLETADO

## Tareas

- [x] Crear migración `NNN_jwt_claims.sql` con UUID v7 PK
- [x] Aplicar migración: `alembic upgrade head`
- [ ] Escribir test: `pytest tests/test_jwt.py::test_claims` → FAIL
- [ ] Implementar `JWTClaimsService` en `backend/app/services/jwt_claims.py`
- [ ] Verificar: `pytest tests/test_jwt.py` → PASS
- [ ] Agregar audit trigger a tabla `jwt_claims`
- [ ] Commit: `feat(auth): add JWT claims service with audit trail`
```

## Al finalizar

```
✅ Todas las tareas completadas.
→ Ejecuta /opsx-verify para validar vs spec
→ Ejecuta /opsx-archive cuando el PR esté mergeado
```
