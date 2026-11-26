---
name: sdd
description: "Desarrollo dirigido por especificación: propuesta, spec con requisitos en formato EARS y criterios de aceptación verificables, plan, tareas con requisito de origen y fase de convergencia que verifica cada criterio contra el código y la salida real de las pruebas, con carril rápido para cambios pequeños. Úsala en funcionalidades no triviales, cambios de varios archivos o requisitos ambiguos (comandos /opsx-propose, /opsx-apply, /opsx-verify, /opsx-archive); no para un typo ni un arreglo de una línea."
---

# Desarrollo dirigido por especificación (SDD)

Ordena el trabajo de una funcionalidad en artefactos escritos que se revisan antes de programar. Complementa a `metodologia-entrega` (cómo
se escribe y se aprueba un requerimiento), `writing-plans` (cómo se planea), `bdd-spec-driven-development` (cómo se vuelve prueba) y
`delegacion-subagentes` (cómo se reparte). La «constitución» del proyecto ya existe: `AGENTS.md` y `rules/`; no se crea otra.

## Fases (una a la vez; no se avanza sin el artefacto escrito)
1. **Proponer** — `changes/<fecha>-<slug>/proposal.md` (`changes/TEMPLATE-proposal.md`): problema, contexto y decisión. El POR QUÉ.
2. **Especificar** — `spec.md` (`changes/TEMPLATE-spec.md`): requisitos funcionales en EARS («CUANDO <evento>, EL SISTEMA DEBERÁ
   <respuesta>», «MIENTRAS <estado>…», «SI <condición no deseada>, ENTONCES…»), cada uno con un id (`RF-01`) y criterios de aceptación
   observables desde fuera; requisitos no funcionales con número (tiempo, volumen, disponibilidad); la señal que demuestra cada requisito en
   producción (`rules/common/observability.md`); reglas de negocio que aplican, con su origen (`reglas-negocio`); casos de borde y fuera de
   alcance. Dice el QUÉ, sin tecnología.
3. **Aclarar** — solo lo que bloquea: como máximo 5 preguntas a la persona, juntas en un solo mensaje. Lo demás se decide y se anota en la
   spec como supuesto, con quién lo decidió.
4. **Planear y desglosar** — `tasks.md` (`changes/TEMPLATE-tasks.md`): el CÓMO (contratos de API y datos, migraciones, skills por tarea, ADR
   necesarios) y tareas numeradas, cada una con **requisito de origen**, archivos, criterio de aceptación y la prueba que lo demuestra.
5. **Implementar** — `/opsx-apply`: por tarea, prueba primero (`test-driven-development`); encargos completos si se delega.
6. **Converger** — `/opsx-verify`: cada criterio de aceptación se verifica **contra el código y la salida real de las pruebas**; el estado se
   marca en `tasks.md`; lo que falle se corrige y se repite. Cada requisito lo cita al menos una prueba
   (`python verifiers/run.py --only spec_traceability`). Lo no verificado se declara como tal.
7. **Archivar** — `/opsx-archive` cuando todo está verificado y fusionado.

## Carril rápido
Un cambio que edita **como máximo 5 archivos** y **no toca** migraciones, esquema de base de datos, contratos de API, autenticación ni
autorización lleva solo `spec.md` corta (requisito en EARS, criterios, archivos y prueba) y el cierre obligatorio de `tasks.md`; no lleva
propuesta ni desglose. Si no cumple la compuerta, se dice por qué y se sigue el flujo completo: seis archivos «pequeños» no son cinco.

## Convergencia con revisión adversaria
Cada tarea cierra con el ciclo de `delegacion-subagentes` §5b: `/adversarial` en una sesión distinta (instancia nueva en cada vuelta),
corrección y nueva revisión hasta que no quede ningún P0/P1. Si el mismo bloqueo se repite sin cambios, se detiene y se escala a la persona.

## Excusas que no cierran una tarea
| Excusa | Realidad |
|---|---|
| «Es un cambio de una línea, no hace falta spec» | Lleva el carril rápido: spec corta, prueba y cierre |
| «La revisión la hago yo mismo» | La revisión adversaria la hace otra sesión; quien implementó no se revisa |
| «Marco la tarea y corro las pruebas después» | Un paso de cierre se marca solo con su reporte y en verde |
| «El criterio no menciona ese error» | Si el código lo valida, se prueba (catálogo de escenarios de `bdd-spec-driven-development`) |
| «La regla es obvia, la asumo» | Solo las reglas confirmadas por el dueño funcional son requisito; lo demás se pregunta |

## Reglas
- La spec y las tareas son la fuente de verdad. Si el código contradice la spec, se corrige primero la spec (con la persona si cambia el
  alcance) y después el código.
- La persona aprueba la spec (y el plan, en el flujo completo) antes de implementar.
- Los artefactos viven en `changes/` y se versionan con el código: son evidencia de trazabilidad (`rules/common/compliance.md`).
- La spec no sustituye a los entregables formales de la metodología: si el proyecto los exige, el requerimiento se lleva al artefacto
  (`metodologia-entrega`).

## Checklist
- [ ] Spec con requisitos EARS identificados, fuera de alcance y criterios de aceptación verificables.
- [ ] Como máximo 5 preguntas; supuestos anotados.
- [ ] Spec aprobada por la persona antes de programar.
- [ ] Cada tarea con requisito de origen y prueba.
- [ ] Convergencia: cada criterio con la salida real de su prueba; lo no verificado, declarado.
- [ ] Cierre obligatorio con su reporte y revisión adversaria APTO o APTO CON OBSERVACIONES.

## Origen
Flujo de artefactos adaptado de OpenSpec (Fission-AI, MIT) y formato EARS de requisitos (Mavin et al.); el texto es propio del framework.
