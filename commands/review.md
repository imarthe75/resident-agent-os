---
description: Revisión de código de solo lectura con el subagente code-reviewer
---

Usa el subagente `code-reviewer` sobre los cambios actuales (`git diff` contra la rama destino) o sobre: $ARGUMENTS

Entrega los hallazgos P0–P4 con `archivo:línea` y corrección concreta, y el veredicto APTO, APTO CON OBSERVACIONES o NO APTO. La
aprobación del Merge Request la da una persona distinta del autor.
