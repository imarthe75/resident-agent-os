# /opsx-propose

**Origen:** Adaptado de [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)  
Inicia un cambio formal generando los artefactos de planificación necesarios antes de escribir código.

## Uso

```
/opsx-propose <nombre-del-cambio>
/opsx-propose "agregar autenticación JWT al módulo de reportes"
```

## Qué hace

1. Crea la carpeta `changes/<YYYY-MM-DD-nombre-kebab>/`
2. Genera los 3 artefactos en secuencia (o todos a la vez con `--ff`):
   - `proposal.md` — el **por qué**: problema, contexto, decisión
   - `spec.md` — el **qué exactamente**: requisitos, restricciones, criterios de aceptación
   - `tasks.md` — el **cómo**: checklist ordenado de implementación
3. Espera aprobación antes de entrar a `/opsx-apply`

## Estructura generada

```
changes/
└── 2026-06-17-agregar-jwt-reportes/
    ├── proposal.md    ← por qué se hace el cambio
    ├── spec.md        ← qué debe cumplir
    └── tasks.md       ← lista de tareas con checkboxes
```

## Formato de proposal.md

```markdown
# Proposal: [Nombre del Cambio]
**Fecha:** YYYY-MM-DD
**Estado:** BORRADOR | APROBADO | RECHAZADO

## Problema
[Qué falla o qué falta]

## Solución propuesta
[Descripción de alto nivel]

## Alternativas consideradas
[Por qué se descartaron otras opciones]

## Impacto
- Archivos afectados: X
- Servicios afectados: Y
- Riesgo: BAJO | MEDIO | ALTO
```

## Flags

- `--ff` — Fast-forward: genera los 3 artefactos en un solo paso
- `--from-spec` — Si ya tienes el spec en `.agent/SPECS.md`, lo usa como base
- `--adr` — Crea también un ADR en `DECISIONS/` si es un cambio arquitectónico

## Flujo completo OpenSpec

```
/opsx-propose → (revisión humana) → /opsx-apply → /opsx-verify → /opsx-archive
```
