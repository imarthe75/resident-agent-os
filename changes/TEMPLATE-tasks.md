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

### Fase 4: Cierre obligatorio (lo ejecuta el agente, nunca se delega a la persona)

Cada tarea de esta fase deja su reporte en `changes/<cambio>/reports/AAAA-MM-DD-<paso>.md` con los comandos ejecutados, la salida resumida
y el resultado. Una tarea se marca `[x]` solo con su reporte escrito y su resultado en verde; un comando que falló o no corrió la deja abierta.

- [ ] Pruebas enfocadas y suite completa (`pytest tests/ -q` → exit 0), con el estado de la base de pruebas antes y después: ninguna
      prueba deja datos (`rules/common/test-isolation.md`) → `reports/…-pruebas.md`
- [ ] Comprobación del servicio levantado en local o en un ambiente desechable: cada endpoint que cambió, con su caso de éxito y sus
      errores (400/401/403/404/409), deshaciendo lo que cree → `reports/…-servicio.md`
- [ ] Pruebas de interfaz (Playwright) si el cambio toca pantallas → `reports/…-e2e.md`
- [ ] `python verifiers/run.py` (incluye `spec_traceability` y `observability_min`) → `reports/…-verificadores.md`
- [ ] `/adversarial` en una sesión distinta → veredicto APTO o APTO CON OBSERVACIONES → `reports/…-revision-adversaria.md`
- [ ] Documentación técnica actualizada (README del módulo, OpenAPI, ADR si cambió una decisión)
- [ ] `/opsx-verify` → sin hallazgos bloqueantes
- [ ] Commit final: `chore: verify NuevoFeature ready for review`

---

<!-- Al archivar, agregar esta sección:
---
**Archivado:** YYYY-MM-DD HH:MM
**Commit final:** <hash>
**Duración:** X días
**Lecciones:** [notas para memory.lessons]
-->
