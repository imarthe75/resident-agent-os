# 📌 Command: /plan

Obliga al agente a suspender toda actividad de código y concentrarse en diseñar el plan de trabajo antes de implementar.

## Comportamiento

1. El agente explora el alcance (archivos relevantes, dependencias).
2. Genera el artefacto de plan siguiendo el skill **`skills/writing-plans/SKILL.md`**.
3. Guarda en `docs/plans/YYYY-MM-DD-<nombre>.md`.
4. **Espera confirmación del usuario** antes de proceder a cualquier implementación.

## Estructura del plan generado

- **Objetivo técnico** — qué se construye y por qué
- **Mapa de archivos** — qué se crea/modifica/testea
- **Tareas granulares** — 2-5 min cada una, con test de verificación incluido
- **Restricciones CaSmarts** — UUID v7, audit triggers, auth, fallback local
- **Preguntas abiertas** — decisiones que requieren input del usuario

## Relación con OpenSpec

Para cambios formales (features, migraciones, integraciones):
```
/opsx-propose  ←── genera proposal.md + spec.md + tasks.md
/plan          ←── genera el plan de implementación detallado
/opsx-apply    ←── ejecuta las tareas del plan
```

Para cambios pequeños (< 3 archivos, < 15 min): usar `/plan` directamente sin OpenSpec.

## Ver también

- `skills/writing-plans/SKILL.md` — cómo escribir planes sin ambigüedad
- `commands/opsx-propose.md` — para cambios que requieren spec formal
