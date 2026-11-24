---
description: Coordina una misión repartiendo el trabajo en subagentes (orquestación)
---

Coordina la misión: $ARGUMENTS

Sigue `contexts/orquestacion.md` y la skill `delegacion-subagentes`: escala el esfuerzo a la complejidad, delega con encargos completos,
pasa todo código por los subagentes `code-reviewer` y `security-reviewer`, cierra cada tarea con el ciclo de convergencia de
`delegacion-subagentes` §5b (revisión adversaria por una instancia nueva en cada vuelta, detenerse si el bloqueo se repite sin cambios) y no
des nada por terminado sin la salida real de las pruebas.
Reporta qué se hizo, qué decidiste, el estado (COMPLETADO, PARCIAL o FALLIDO) y qué sigue. Sin commits, push ni instalaciones.
