# Contexto: revisión

Revisa contra `rules/` y las skills del stack con las listas de `agents/code-reviewer.md` y `agents/security-reviewer.md`.
Cada hallazgo lleva archivo:línea, regla incumplida y corrección. Un MR sin pruebas de la regla que cambia, sin documentación del endpoint,
con un verificador en `NO_CUMPLE` o con un hallazgo nuevo alto/crítico del escáner no se aprueba.
