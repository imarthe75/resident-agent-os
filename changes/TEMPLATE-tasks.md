# Tasks: [Nombre del Cambio]

**Cambio:** `changes/YYYY-MM-DD-nombre/`  
**Estado:** PENDIENTE | EN PROGRESO | COMPLETADO  
**Iniciado:** YYYY-MM-DD  

---

## Tareas

### Fase 1: Base de Datos

- [ ] Escribir migración `db/migrations/NNN_descripcion.sql`
  - PK UUID v7, campos necesarios, índices
- [ ] Aplicar migración: `alembic upgrade head && alembic current`
- [ ] Agregar audit triggers: `SELECT auditoria.habilitar_auditoria('<esquema>.<tabla>');` (el instalador `sql/auditoria_estandar_completo.sql` ya debe estar aplicado en la base)

### Fase 2: Backend

- [ ] Escribir test: `pytest tests/test_nuevo.py::test_comportamiento` → **DEBE FALLAR**
- [ ] Implementar modelo SQLAlchemy en `backend/app/models/nuevo.py`
- [ ] Implementar router FastAPI en `backend/app/routers/nuevo.py`
- [ ] Agregar middleware auth en endpoints sensibles
- [ ] Verificar: `pytest tests/test_nuevo.py` → **TODOS PASAN**
- [ ] Commit: `feat(backend): add NuevoService with audit trail`

### Fase 3: Frontend

- [ ] Escribir test de componente → **DEBE FALLAR**
- [ ] Implementar componente Angular en `frontend/src/app/nuevo/`
- [ ] Verificar: `npm test -- --testNamePattern="nuevo"` → **TODOS PASAN**
- [ ] Commit: `feat(frontend): add NuevoComponent`

### Fase 4: Verificación final

- [ ] Ejecutar suite completa: `pytest tests/ -q` → exit code 0
- [ ] Verificar servicio: `docker compose ps` → todos running
- [ ] Ejecutar `/opsx-verify` → sin hallazgos bloqueantes
- [ ] Commit final: `chore: verify NuevoFeature ready for review`

---

<!-- Al archivar, agregar esta sección:
---
**Archivado:** YYYY-MM-DD HH:MM
**Commit final:** <hash>
**Duración:** X días
**Lecciones:** [notas para memory.lessons]
-->
