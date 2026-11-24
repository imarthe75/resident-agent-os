---
name: auditoria-codigo
description: "Auditoría de código de un repositorio sin depender de un escáner: revisa el código contra el catálogo de reglas de prevencion-hallazgos-seguridad-calidad (los mismos identificadores que usa un escáner de seguridad) con el método de detección de references/, clasifica cada hallazgo (categoría, severidad P0–P4, nivel de evidencia), registra falsos positivos y riesgos aceptados con justificación, y genera resumen, matriz con plazos y comparativo entre corridas con scripts/auditoria.py. Úsala cuando se pida auditar, revisar la seguridad o la calidad de un proyecto o de un módulo, verificar el cierre de una auditoría anterior o preparar un reporte de hallazgos."
---

# Auditoría de código sin escáner

Un agente puede auditar con el mismo rigor que un escáner si sigue sus reglas: **las mismas reglas, la misma clasificación y la misma
forma de comparar corridas**, con evidencia en vez de opinión. Esta skill no ejecuta ninguna herramienta de análisis: lee el código,
aplica el método de detección y deja los resultados en un archivo que un script valida.

## Activar cuando
- se pida auditar un proyecto, un módulo o un merge request grande;
- se quiera verificar si se corrigieron los hallazgos de una auditoría anterior;
- haga falta un reporte de hallazgos para otra persona.

## No activar cuando
- solo se revisa un cambio pequeño: para eso los subagentes `code-reviewer` / `security-reviewer` (comandos `/review`, `/audit`).

## Fuentes
| Qué | Dónde |
|---|---|
| **Qué buscar** (reglas con identificador y su corrección) | `prevencion-hallazgos-seguridad-calidad/references/catalogo-reglas.md` |
| Catálogo ampliado por tema (STRIDE, OWASP, inyección, multi-tenant, clases de error) | `references/estandar-maestro.md` |
| **Cómo encontrarlo** sin escáner (patrones de búsqueda, muestreo, falsos positivos) | `references/metodologia-deteccion.md` |
| Comandos de verificación, tarjeta de hallazgo y estructura del reporte | `references/reporte-y-verificacion.md` |

## Flujo
1. **Alcance.** Repositorio, rama y commit; categorías (Vulnerabilidad, Cumplimiento, Informativo), reglas o carpetas que se revisan.
   Se escribe en el archivo de hallazgos (`alcance`). Lo que queda fuera se declara, no se omite.
2. **Detección por regla.** Por cada regla del alcance: patrón de búsqueda (`references/metodologia-deteccion.md`), lectura de cada
   coincidencia en su contexto y descarte de falsos positivos conocidos. Un `grep` de presencia no es un hallazgo; la línea leída sí.
3. **Clasificar.** Cada hallazgo lleva:
   - **regla** (identificador del catálogo; si no existe, uno nuevo con el mismo estilo y se propone agregarlo al catálogo);
   - **categoría**: Vulnerabilidad (explotable o con fuga de datos), Cumplimiento (accesibilidad u obligación legal), Informativo (calidad);
   - **severidad** de la regla y, si el contexto la cambia, la ajustada con su justificación; **nunca se sube ni se baja sin evidencia**;
   - **evidencia**: Cierto (comando ejecutado con salida), Probable (patrón confirmado leyendo el código), Hipótesis (por verificar).
     Una Hipótesis no se reporta como Crítica ni Alta;
   - **ubicación**: un hallazgo por regla y archivo, con todas sus líneas.
4. **Triage.** `falso_positivo` solo con justificación de por qué no aplica **en ese archivo** (nunca para toda la regla);
   `riesgo_aceptado` solo con justificación de quien decide y fecha de vencimiento (máximo 365 días). La IA propone; decide una persona.
5. **Validar y generar.**
   ```bash
   python3 scripts/auditoria.py validar  hallazgos.json
   python3 scripts/auditoria.py resumen  hallazgos.json --out reporte/      # resumen.md + matriz.csv (plazo por severidad)
   python3 scripts/auditoria.py comparar anterior.json hallazgos.json --out reporte/
   ```
   Plazos: Crítica 24 h · Alta 7 días · Media 30 días · Baja 90 días.
6. **Reporte.** Estructura de `references/reporte-y-verificacion.md`. Sin puntajes globales ni porcentajes inventados.

## Comparar con una corrida anterior
Se empareja por regla y archivo: **Persiste** (y «cambió de línea» si solo se movió), **Solventado**, **Nuevo**, **Reaparecido** (estaba
corregido y volvió) y **No re-verificado** (la corrida actual no revisó esa regla o ese archivo, así que su ausencia no prueba que se
corrigió). Quien corrigió no valida su propio cierre.

## Formato del archivo de hallazgos
```json
{ "alcance": { "categorias": ["VULNERABILIDAD"], "reglas": null, "archivos": ["back/"] },
  "hallazgos": [
    { "id": "SEC-01", "regla": "AUTHZ-NO-METHOD-AUTHZ", "titulo": "…", "severidad": "ALTA", "categoria": "VULNERABILIDAD",
      "archivo": "back/…/ExpedienteController.java", "lineas": [88, 120], "evidencia": "Cierto", "estado": "abierto",
      "detectado": "2026-11-01", "esfuerzo_horas": 2, "responsable": "equipo backend" } ] }
```
Estados: `abierto`, `corregido`, `falso_positivo` (con `justificacion`), `riesgo_aceptado` (con `justificacion` y `vence_aceptacion`).
Ejemplos: `examples/hallazgos.corrida1.json` y `examples/hallazgos.corrida2.json`.

## Reglas
- Nada de secretos en el reporte: se dice dónde están y que hay que rotarlos, nunca su valor.
- Las cifras salen del archivo de hallazgos con su fecha de corte; nada se redondea «para que se vea mejor».
- Un hallazgo sin `archivo:línea` leída no se entrega.
- El reporte presenta el estado final; no narra los intentos.

## Checklist
- [ ] Alcance declarado en el archivo de hallazgos.
- [ ] Cada hallazgo con regla, categoría, severidad, evidencia y `archivo:línea` leídas.
- [ ] Falsos positivos y riesgos aceptados con justificación (y vencimiento).
- [ ] `auditoria.py validar` sin errores; `resumen.md`, `matriz.csv` y, si aplica, `comparativo.md` generados.
- [ ] Límites declarados en el reporte.
