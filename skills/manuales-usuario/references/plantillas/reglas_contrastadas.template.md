# Reglas contrastadas — <Módulo>

- **Fuente:** `reglas_negocio.md` (<origen>).
- **Evidencia:** `evidencia.md`, generado con `evidencia.js --front <carpeta> --back <Prefijo>`.
- **Rutas:** relativas a `<raíz del sistema>`.
- **Fecha del contraste:** <AAAA-MM-DD>.
- **Contrastó:** <IA / persona>. Revisó: <analista>.

**Estados.** `confirmada` (front y back) · `solo_front` · `solo_back` · `no_documentada` (está en el código, falta en la fuente) · `decidida` (discrepancia resuelta por un humano) · `solo_vista_previa` (el control solo cambia la vista previa; se documenta como limitación) · **no citables:** `discrepancia`, `no_implementada`, `sin_efecto` (el control no hace nada; va a Hallazgos).

**Evidencia dinámica.** Además de `ruta:línea`, se admite `prueba:<script>@AAAA-MM-DD` (p. ej. `prueba:docs/validacion/verificar_campos.py@2026-11-05`) cuando la regla se comprobó cambiando un campo a la vez. La fecha es obligatoria; a los 180 días la validación avisa.

| ID | Regla | Fuente | Front | Back | Estado | Decisión / nota |
|---|---|---|---|---|---|---|
| RN-01 | <regla> | <fuente> | `front/src/app/features/<feature>/pages/<archivo>.ts:<línea>` | `back/src/main/java/<…>/<Clase>.java:<inicio>-<fin>` | confirmada | |
| RN-02 | <regla> | <fuente> | `<ruta>:<línea>` | — | solo_front | <por qué no está en el back> |
| RN-03 | <regla> | <fuente> | `<ruta>:<línea>` | `<ruta>:<línea>` | discrepancia | <qué hace el código en realidad · quién decide> |
| RN-05 | <control que solo cambia la vista previa> | <fuente> | `<ruta>:<línea>` | `prueba:<script>@<AAAA-MM-DD>` | solo_vista_previa | El login real no cambia. |
| RN-06 | <control que no hace nada> | <fuente> | `<ruta>:<línea>` | — | sin_efecto | Hallazgo: quitar el control o implementarlo. |
| RN-04 | <comportamiento encontrado en el código> | — | `<ruta>:<línea>` | `<ruta>:<línea>` | no_documentada | Agregar a la fuente. |

## Hallazgos para el equipo (no van al manual)

1. <Discrepancias y quién debe decidir.>
2. <Validaciones que solo están en el front (riesgo de datos inválidos por la API).>
3. <Errores de ortografía en mensajes del sistema.>
