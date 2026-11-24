---
description: Revisión adversaria de un cambio terminado, en una sesión distinta a la que lo implementó
---

Usa el subagente `adversarial-reviewer` sobre: $ARGUMENTS (cambio, especificación o MR). Si no se indica, el cambio en curso de esta rama.

Antes de dar el veredicto vuelve a correr las pruebas y verificadores que el autor cita, y revisa qué mutantes sobrevivirían en el código
de producción que cambió. Entrega hallazgos P0–P4 y el veredicto APTO, APTO CON OBSERVACIONES o NO APTO. Si el veredicto es NO APTO, el
cambio vuelve a implementación y la siguiente revisión la hace una instancia nueva del subagente.
