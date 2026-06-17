# Changes (OpenSpec Workflow)

Este directorio gestiona los cambios activos e históricos del proyecto siguiendo el workflow OpenSpec.

## Estructura

```
changes/
├── README.md             ← este archivo
├── <cambio-activo>/      ← cambios en progreso
│   ├── proposal.md       ← por qué se hace el cambio
│   ├── spec.md           ← qué debe cumplir exactamente
│   └── tasks.md          ← checklist de implementación
└── archive/              ← cambios completados
    └── <cambio-cerrado>/
```

## Workflow

```
/opsx-propose → (revisión) → /opsx-apply → /opsx-verify → /opsx-archive
```

| Command | Cuándo usarlo |
|---------|--------------|
| `/opsx-propose` | Al iniciar cualquier feature, fix o refactor significativo |
| `/opsx-apply` | Para ejecutar las tareas del cambio activo |
| `/opsx-verify` | Antes de mergear: valida que la impl cumple el spec |
| `/opsx-archive` | Después del merge: cierra el cambio y puede generar lección |

## Nomenclatura

Los directorios de cambio siguen el patrón: `YYYY-MM-DD-nombre-kebab`

Ejemplos:
- `2026-06-17-agregar-jwt-reportes`
- `2026-06-20-migrar-uuid-v7`
- `2026-06-25-integrar-celery-tasks`

## Relación con DECISIONS/ y memory.lessons

- Si el cambio implica una decisión arquitectónica → crear ADR en `DECISIONS/`
- Al archivar con `--with-lesson` → la lección se persiste en `memory.lessons` (PostgreSQL + pgvector)
