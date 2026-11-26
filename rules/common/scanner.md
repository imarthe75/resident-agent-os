# Trabajo con el escáner de seguridad y calidad

Aplica a cualquier escáner que el equipo use sobre el código (SAST, dependencias, secretos, contenedores, accesibilidad) y sobre la
aplicación desplegada (DAST). La corrección de cada regla está en la skill `prevencion-hallazgos-seguridad-calidad`; las reglas de seguridad,
en `rules/common/security.md`.

## 1. Antes de cambiar código
1. Consulta los hallazgos abiertos de los archivos que vas a tocar (skill `preflight`, o el reporte más reciente del escáner). Si el
   cambio toca un archivo con un hallazgo abierto, corrígelo en el mismo cambio o dilo en el MR.
2. Lee qué busca exactamente la regla antes de corregir: el detector dice qué patrón busca y qué cuenta como corregido (p. ej. autorización en
   el método del servidor, no un guard en el frontend).

## 2. Criterio de aceptación de un Merge Request
1. **Cero hallazgos nuevos de severidad alta o crítica** en las líneas que agrega el MR; si el escáner deja un estado en el MR, con `failed`
   no se integra.
2. Hallazgos nuevos medios y bajos: corregidos o justificados en el MR.
3. Un MR no aumenta la deuda de la rama: el escaneo siguiente no muestra más hallazgos abiertos que antes en los archivos tocados.

## 3. Cómo leer lo que reporta
1. **Severidad efectiva** = la que se fijó tras analizar el caso o, si no hay análisis, la de la herramienta. Un análisis automático puede
   bajarla con justificación, nunca subirla; un humano puede revertir esa decisión.
2. **Vulnerabilidades**, **cumplimiento** (accesibilidad, con plazo propio) e **informativos** (calidad, deuda, convenciones) se cuentan por
   separado.
3. **Plazos** según la severidad efectiva, los que fije la organización (referencia: crítico 24 h, alto 7 días, medio 30, bajo 90).
4. Un análisis «a nivel de patrón» explica la regla una vez para todas sus ocurrencias; no revisó cada línea: revísalas.
5. Un hallazgo **reabierto** es una regresión: algo que ya se había corregido volvió.

## 4. Cuándo un hallazgo no se corrige
1. Si es falso positivo o riesgo aceptado, se clasifica con la causa escrita y quién lo decide (skill `triage-findings`). La supresión es por
   hallazgo concreto (archivo y línea, o huella), nunca por regla completa, y el riesgo aceptado lleva fecha de vencimiento.
2. Prohibido cambiar el código solo para que el detector deje de verlo (renombrar, partir una línea, mover a un archivo excluido) sin
   corregir el riesgo.
3. Prohibido aplicar un parche sugerido que no se validó contra el código real (`git apply --check`); un parche sin validar es guía, no se pega.

## 5. Cumplimiento
- Los porcentajes de ISO 27001, CMMI, OWASP o WCAG que muestre una herramienta miden solo lo que tiene detector; lo que no se puede medir es
  **NO EVALUADO**, no cumplido. Para subir un porcentaje se corrige el hallazgo o se produce la evidencia, nunca se reclasifica para que deje
  de contar (`rules/common/compliance.md`).
- Un «0 hallazgos» solo significa algo donde el motor corrió y con las reglas que tiene.
