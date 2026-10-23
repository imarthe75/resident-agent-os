---
name: triage-findings
description: Método para cruzar varios insumos de seguridad (auditoría manual, análisis de segundo nivel, escáneres) y clasificar cada hallazgo como vulnerabilidad, falso positivo o riesgo aceptado, con evidencia.
---

# Triage de hallazgos de seguridad

**Cuándo aplicar:** cuando hay reportes que se repiten o se contradicen y hay que decidir qué corregir.

## Método
1. **Inventario.** Une todos los insumos en una sola lista; cada hallazgo conserva su fuente.
2. **Agrupa por causa, no por ocurrencia.** Un patrón repetido 300 veces es una decisión, no 300 tickets. Anota cuántas ocurrencias y en qué archivos.
3. **Clasifica cada grupo con evidencia** (abre el código, no confíes en el título):
   - **Vulnerabilidad** — el código es alcanzable y el impacto es real. Registra archivo y línea.
   - **Falso positivo** — el detector coincidió con algo inofensivo (texto, prueba, código muerto, valor controlado). Explica por qué en una frase y guarda el caso para ajustar el detector.
   - **Riesgo aceptado** — es real pero se decide no corregir; requiere responsable, motivo y fecha de revisión.
   - **No evaluado** — no se pudo comprobar. Nunca se reporta como «limpio».
4. **Severidad efectiva.** Conserva la severidad de la herramienta y anota la real si difiere, con la razón en la primera frase («Aunque se reporta como ALTA, el riesgo real es BAJO porque…»). La IA o la herramienta nunca sube la severidad por sí sola.
5. **Verifica por muestreo.** Revisa a mano una muestra de cada clase, sobre todo de los falsos positivos y de lo descartado.
6. **Salida.** Un informe con dictamen por grupo citado a archivo y sección, y una tabla (xlsx/csv) con una fila por ocurrencia: clasificación, evidencia, responsable.
7. **Verifica la corrección contra el escaneo anterior.** Cuando el equipo dice «ya quedó», guarda primero la lista de lo abierto (la línea base), vuelve a escanear y clasifica cada hallazgo de esa lista:
   - **Solventado** — el mismo detector volvió a correr completo sobre ese código y ya no lo encontró.
   - **Persiste** — sigue apareciendo. Si solo cambió de línea porque se editó el archivo, es el mismo hallazgo (empareja por regla + archivo), no uno nuevo y otro resuelto.
   - **No re-verificado** — el detector que lo encontró no volvió a correr, falló o solo revisa una parte (un DAST que no recorrió esa URL, una herramienta caída). **Nunca cuenta como solventado.**
   - **Nuevo** / **Reaparecido** — no estaba en la línea base, o ya se había cerrado y volvió.
   Reporta lo que queda abierto con su severidad efectiva actual, no la del primer escaneo.

## Reglas
- Lo descartado por una IA lo confirma una persona antes de suprimirse.
- Cada decisión humana se guarda con quién y cuándo; no se pisa en una segunda corrida.
- Ninguna cifra de «cumplimiento» o «resueltos» se publica sin las ocurrencias abiertas que la sustentan.
- «Resuelto» lo demuestra un nuevo escaneo completo del mismo detector, no la palabra del equipo ni un commit con el mensaje «fix».
