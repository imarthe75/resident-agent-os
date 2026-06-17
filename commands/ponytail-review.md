# /ponytail-review

Audita el diff actual contra el Efficiency Ladder (`rules/common/efficiency.md`).

## Uso

```
/ponytail-review
/ponytail-review --strict
```

## Qué hace

1. Obtiene el diff con `git diff HEAD` (o el staged diff si hay cambios en staging).
2. Para cada bloque nuevo de código, evalúa en qué peldaño del ladder se encuentra.
3. Reporta:
   - **Peldaño usado** vs **peldaño óptimo disponible**
   - **Ahorro estimado** si se sube de peldaño
   - **Marcadores `ponytail:`** que deben agregarse si se acepta el trade-off

## Formato de salida

```
[ponytail-review] 3 hallazgos en 2 archivos

① backend/app/utils/uuid_helper.py:12
  Peldaño actual: 6 (custom)  →  Óptimo: 2 (stdlib uuid)
  Ahorro: ~15 líneas
  Fix: import uuid; uuid.uuid4()

② frontend/src/utils/debounce.ts:8
  Peldaño actual: 6 (custom)  →  Óptimo: 4 (lodash.debounce ya instalado)
  Ahorro: ~20 líneas

③ [ACEPTADO] memory/semantic_cache.py:45
  Peldaño: 5 (simple inline)  — Óptimo confirmado ✓
```

## Modo --strict

Falla si hay algún hallazgo con diferencia de ≥2 peldaños. Útil como quality gate pre-commit.
