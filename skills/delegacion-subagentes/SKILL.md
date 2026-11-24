---
name: delegacion-subagentes
description: Cómo encargar trabajo a otro agente (subagente de Claude Code, Gemini, otro modelo o una persona) sin perder información — encargo completo, entrega por archivo, paralelo solo lo independiente, límite de reintentos y verificación del resultado antes de darlo por hecho. Úsala cuando un agente vaya a delegar una tarea, coordinar varios agentes o integrar el trabajo que otro entregó.
---

# Delegación a subagentes

Un encargo vago produce trabajo duplicado o equivocado, y un reporte de un subagente no es evidencia. Esta skill fija cómo se encarga,
cómo se entrega y cómo se verifica.

## Activar cuando
- un agente encarga una tarea a otro agente o a otro modelo;
- se reparten tareas en paralelo;
- se integra lo que otro agente entregó.

## No activar cuando
- el cambio es pequeño (pocas líneas, un archivo): hacerlo directamente cuesta menos que explicarlo.

## 1. El encargo (siempre completo)
```markdown
**Objetivo:** <qué debe quedar hecho, en una frase: el resultado, no el procedimiento>
**Requisito de origen:** <RF-xxx, ticket o caso de uso; sin requisito no hay trazabilidad>
**Contexto:** <por qué; decisiones ya tomadas; requisito o ticket de origen>
**Alcance permitido:** <archivos o carpetas que puede tocar; lo demás, solo lectura>
**Skills y reglas a cargar:** <p. ej. backend-modulo-crud, rules/java/rules.md>
**Entrega:** <archivo donde deja su reporte + resumen de 5 líneas como máximo con su ruta>
**Criterio de aceptación:** <comando o prueba que demuestra que terminó, y su resultado esperado>
**Restricciones:** <sin commits ni push; sin dependencias nuevas; sin tocar la base; tiempo máximo>
```
- El criterio de aceptación es **un comando o una prueba**, no «que funcione».
- Sin credenciales ni datos reales en el encargo; nada externo se instala ni se consulta (`rules/common/privacidad-y-herramientas.md`).
- Nunca se pasan secretos en el encargo; el subagente los toma del mismo gestor de secretos que el proyecto.
- A un modelo o servicio externo solo se le envía lo que permite la política de datos del proyecto (código del cliente incluido).

## 2. Escala de esfuerzo
| Tarea | Quién la hace |
|---|---|
| Trivial (typo, una línea, configuración puntual) | El agente principal, sin delegar |
| Bug o cambio pequeño | Un subagente adecuado (`debugger` si es un fallo) |
| Módulo o funcionalidad mediana | `planner` → implementación → `code-reviewer` + `security-reviewer` |
| Funcionalidad grande o requisitos ambiguos | Flujo `/opsx-propose` → `/opsx-apply` → `/opsx-verify` |

Más agentes para algo simple gastan contexto y producen ruido. En Claude Code la orquestación la hace la conversación principal
(`contexts/orquestacion.md`, comando `/team`): un subagente no puede lanzar otros.

## 3. Entrega por archivo
El subagente escribe su reporte, spec o diff en un archivo del proyecto (p. ej. `changes/<tarea>/` o la carpeta que fije el proyecto) y
devuelve solo un resumen con la ruta. En el flujo `/opsx-propose` la carpeta es `changes/<cambio>/`. Así nada se pierde entre intermediarios y otra persona puede revisar el mismo material.

## 4. Paralelo y en serie
- En paralelo solo lo **independiente** (no comparten archivos ni dependen del resultado del otro); como máximo 3–4 a la vez.
- En serie lo dependiente (diseño → implementación → revisión).
- Los subagentes no se coordinan entre sí: todo pasa por quien delegó, que arbitra los conflictos con criterio de producto y calidad.
- No se lanza la tarea dependiente «a ver qué sale»: se espera el reporte y sus conclusiones entran al siguiente encargo.

## 5. Verificar antes de dar por hecho
1. Leer el `git diff` real, no solo el resumen.
2. Ejecutar el criterio de aceptación uno mismo.
3. Pasar las compuertas que correspondan: `code-reviewer`, `security-reviewer` (agentes de `agents/`, veredicto APTO / APTO CON
   OBSERVACIONES / NO APTO) y la skill `verification-before-completion`.
4. Si el subagente dice «hecho» y el criterio no pasa, no está hecho.

## 6. Reintentos y escalamiento
- Si un subagente falla **dos veces** en lo mismo, se cambia de enfoque (otro encargo, otra división de la tarea u otro agente).
- Si sigue atascado, se escala a una persona con: qué se pidió, qué se obtuvo, qué falló y qué decisión hace falta. No se reportan los
  intentos uno por uno (`reglas-globales`: el entregable es el estado final).
- Decide quien delegó los detalles técnicos; se escala a una persona solo producto, alcance, costo o riesgo.

## Checklist
- [ ] Encargo con los ocho campos; criterio de aceptación ejecutable.
- [ ] Entrega en archivo con ruta.
- [ ] Paralelo solo lo independiente.
- [ ] `git diff` leído y criterio ejecutado por quien delegó.
- [ ] Revisión con veredicto antes de declarar terminado.
