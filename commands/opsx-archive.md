# /opsx-archive

**Origen:** Adaptado de [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)  
Finaliza un cambio completado y lo mueve al archivo histórico.

## Uso

```
/opsx-archive
/opsx-archive changes/2026-06-17-agregar-jwt-reportes/
```

## Prerrequisitos

Antes de archivar, el sistema verifica:
- [ ] Todas las tareas en `tasks.md` marcadas como `[x]`
- [ ] `/opsx-verify` ejecutado y sin hallazgos críticos
- [ ] PR mergeado (o commit en main confirmado)

Si algún prerequisito falla, muestra qué falta pero permite continuar con `--force`.

## Qué hace

1. Mueve `changes/<cambio>/` → `changes/archive/<YYYY-MM-DD-cambio>/`
2. Agrega al final de `changes/archive/<cambio>/tasks.md`:

```markdown
---
**Archivado:** YYYY-MM-DD HH:MM
**Commit final:** <hash>
**Duración:** X días desde proposal
**Lecciones:** [Si hay algo notable, registrar aquí para memory.lessons]
```

3. Si se usó `--with-lesson`: genera un embedding de las lecciones y lo guarda en `memory.lessons` vía `memory/long_term_memory.py`.

## Flags

- `--force` — Archivar aunque no todos los prereqs estén completos (documenta la razón)
- `--with-lesson "<texto>"` — Guarda una lección en la memoria de largo plazo
- `--adr` — Crea un ADR en `DECISIONS/` antes de archivar

## Estructura post-archive

```
changes/
├── archive/
│   └── 2026-06-17-agregar-jwt-reportes/  ← histórico
│       ├── proposal.md
│       ├── spec.md
│       └── tasks.md  ← con sección de cierre
└── [cambios activos]
```

## Rito de Cierre

`/opsx-archive --with-lesson` es el mecanismo preferido para el **Rito de Cierre** del agente. Las lecciones archivadas se convierten en memoria de largo plazo recuperable en sesiones futuras.
