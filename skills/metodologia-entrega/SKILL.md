---
name: metodologia-entrega
description: "Metodología genérica de entrega de software por etapas: un esqueleto común (inicio y adaptación, requerimientos, diseño, construcción y verificación, aceptación del usuario, despliegue y cierre, más soporte y evolutivo) con propósito, criterios de entrada y salida, entregables, roles y compuerta de cierre de cada etapa, reglas de adaptación por proyecto, control de cambios y trazabilidad a CMMI V3.0. Úsala al planear o arrancar un proyecto, al cerrar una etapa, al decidir qué entregables aplican, o cuando un agente deba saber en qué etapa está y qué puede o no hacer en ella."
---

# Metodología de entrega

Un esqueleto común más reglas explícitas de adaptación: dos proyectos distintos siguen las mismas etapas y obtienen resultados comparables
sin que nadie invente el proceso cada vez. Si la organización tiene una metodología propia, gana la suya; esta skill cubre lo que no diga.
El detalle de cómo se escribe un requerimiento, se diseña, se prueba y se atiende un ticket está en `rules/common/delivery-process.md`.

## Principios
1. **Cada etapa cierra con evidencia, no con una declaración.** Su compuerta (checklist de cierre) se responde con artefactos, pruebas y
   revisiones reales; lo que no aplica se marca `no aplica: <motivo>` (`references/compuertas.md`).
2. **Trazabilidad de punta a punta:** requisito → diseño → código → prueba → aceptación. Cada eslabón cita al anterior; un eslabón
   suelto es un hueco, no un detalle.
3. **Artefactos vivos:** la matriz de trazabilidad, la estimación, los casos de aceptación y la bitácora de decisiones nacen en la etapa 1
   y se actualizan en cada etapa; no se reescriben al final.
4. **La IA propone, una persona decide.** Firmas, fechas de sesión, decisiones, montos y alcance los pone una persona. Lo que redacta un
   agente en un documento formal lleva la marca de revisión humana.
5. **El alcance cambia solo por control de cambios** (abajo): nada se acepta «de palabra» en una sesión.

## Adaptación (tailoring), al iniciar el proyecto
Se registra una vez, con el visto bueno del líder técnico, y de ella salen los puntos «aplica cuando» de cada compuerta.
| Eje | Opciones | Qué cambia |
|---|---|---|
| Ciclo de vida | Predictivo (etapas en serie) · iterativo (etapas 2–4 por incremento) · continuo (flujo de cambios pequeños) | Cuántas veces se recorren las etapas 2–4 y cuándo se firma |
| Tipo de trabajo (uno o varios) | A la medida · integración · personalización de un producto · migración, datos o infraestructura | Qué checklists técnicos se activan en diseño y construcción |
| Base de arranque | Parte de una plantilla o base reutilizable de la organización (por omisión) · desde cero (con motivo) | La estimación y cuánto de la construcción es configurar y extender |
| Interfaz de usuario | Sí · no | Si aplican prototipo, diseño visual, especificación de campos, accesibilidad y manual de usuario |
| Restricciones del contrato | Uso de herramientas de IA con el código del cliente · ambientes y credenciales | Si el agente puede leer el código; quién despliega |

## Etapas
| # | Etapa | Propósito | Entra con | Sale con (entregables) |
|---|---|---|---|---|
| 0 | Inicio y adaptación | Decidir si se hace y cómo | Solicitud del cliente | Registro de adaptación, plan inicial, roles (RACI), riesgos iniciales |
| 1 | Requerimientos | Qué se construye y cómo se comprueba | Proyecto aprobado | Requerimientos en seis campos, requisitos del contrato no funcionales, matriz de trazabilidad, estimación, primera versión de los casos de aceptación, plan base aprobado |
| 2 | Diseño | Cómo se construye | Requerimientos aprobados | Arquitectura y decisiones (ADR), modelo de datos, contratos de API, prototipo y especificación de campos (con interfaz), excepciones al catálogo tecnológico resueltas |
| 3 | Construcción y verificación | Construirlo según el diseño y demostrarlo | Diseño aprobado | Código en merge requests revisados por otra persona, CI en verde, pruebas unitarias y de integración, análisis de seguridad sin hallazgos nuevos altos, documentación del código y del API |
| 4 | Aceptación del usuario | Que el usuario confirme que resuelve su necesidad | Incremento desplegado en el ambiente de aceptación | Casos ejecutados por el usuario con su registro, hallazgos clasificados (defecto · cambio · zona gris), acta de aceptación |
| 5 | Despliegue y cierre | Ponerlo en producción y transferir el conocimiento | Aceptación firmada | Runbook verificable, evidencia de rollback probado, acta de despliegue, paquete de entrega (sin credenciales), manual de usuario (con interfaz), inicio de garantía, lecciones aprendidas |
| S | Soporte y evolutivo | Atender lo que pasa después del cierre | Ticket con el mínimo de información | Ticket clasificado (incidente o servicio sin cambio, tamaño, plazo), corrección con su prueba, cierre con un solo motivo |

Detalle de cada etapa (decisiones que la definen, quién hace y quién responde, qué hace el agente): `references/etapas.md`.
Compuertas de cierre: `references/compuertas.md`.

## Plantillas
Una plantilla Markdown por entregable en `plantillas/` (catálogo y convención en `plantillas/README.md`): tabla de control, quién llena
cada sección (`> Llena: persona` · `IA (revisión obligatoria)` · `derivado de <fuente>`), pendientes entre `«…»` y firmas en blanco.
1. Copia la plantilla al proyecto (`docs/entregables/<etapa>/`) y llénala con datos reales; el agente nunca llena las secciones de persona.
2. Lo que redacta la IA lleva al final de su sección la línea `Revisó: <nombre> · <fecha>`.
3. Antes de entregar: `python3 scripts/verificar_entregable.py <documento.md>` (pendientes, revisión de lo redactado por IA, secciones
   obligatorias, secretos). Ejemplo llenado: `examples/adr-0001-motor-de-colas.md`.
4. Versión `.docx` con la identidad de la organización:
   ```bash
   docker run --rm --user $(id -u):$(id -g) -v <skill>:/s -v $PWD:/w -w /w node:26-slim sh -c "cd /s && npm ci --no-audit --no-fund"   # una vez
   docker run --rm --user $(id -u):$(id -g) -v <skill>:/s:ro -v $PWD:/w -w /w node:26-slim \
     node /s/scripts/render_docx.mjs --doc docs/entregables/2/adr-0001.md --out salida/adr-0001.docx [--marca marca.json] [--borrador]
   ```
   Aplica las mismas compuertas que el verificador y además exige la organización en `references/marca.json` (organización, logo PNG,
   color primario, fuente). Si algo falla no genera el final (código 2); con `--borrador` genera y marca «BORRADOR» en cada página.
   El contenido sale siempre de la plantilla llenada: el `.docx` no se edita a mano.

## Control de cambios
Solo con el proyecto vivo (antes del cierre). Toda petición nueva: se registra → se analiza su impacto en alcance, tiempo, costo y riesgo →
decide el responsable del proyecto con el cliente → si se aprueba, actualiza requerimientos, matriz, estimación y plan (nueva versión
con su causa). Con el proyecto cerrado, lo nuevo entra por soporte como evolutivo; si es grande, como proyecto nuevo.

## Frontera con el cliente
Se acuerda en la etapa 0 y se respeta en 4, 5 y soporte: quién es dueño de cada ambiente, quién tiene credenciales y quién despliega.
Cuando el ambiente es del cliente, su equipo ejecuta el despliegue con el runbook y el equipo del proyecto asesora en sesión registrada.
Nunca se usan credenciales del cliente que no se entregaron formalmente ni se despliega por un canal no acordado.

## Gestión del proyecto (acompaña todas las etapas)
- **Plan** con línea base aprobada; se versiona en cada cambio aprobado.
- **Seguimiento** con ritmo fijo (p. ej. quincenal): avance contra plan, riesgos, decisiones y bloqueos, en una bitácora que alimenta las
  lecciones del cierre. El avance se mide por requerimientos con pruebas aprobadas, no por archivos creados.
- **Riesgos** como sección viva del plan: probabilidad, impacto, respuesta y dueño.

## Qué hace el agente en cada etapa
| Etapa | Sí | No |
|---|---|---|
| 1 | Revisar requerimientos contra los seis campos y sus síntomas; proponer criterios comprobables y casos de aceptación | Decidir alcance ni prioridades |
| 2 | Proponer arquitectura con alternativas (ADR), contratos de API, prototipo sobre la base de arranque | Aprobar excepciones al catálogo tecnológico |
| 3 | Programar con pruebas primero, documentar, revisar (`/review`, `/audit`), auditar (`auditoria-codigo`) | Fusionar su propio trabajo ni saltarse la revisión de otra persona |
| 4 | Preparar casos y datos ficticios, clasificar hallazgos con evidencia | Ejecutar la aceptación por el usuario ni discutir su resultado |
| 5 | Redactar el runbook verificable, el manual de usuario (`manuales-usuario`) y las lecciones | Desplegar en ambientes del cliente sin el canal acordado |
| S | Diagnosticar, clasificar, proponer el tamaño | Tocar código, configuración, datos o despliegue en un servicio sin cambio |

## Trazabilidad a CMMI V3.0
Cada etapa deja la evidencia de sus áreas (`references/etapas.md`): 1 → RDM, PLAN, EST · 2 → TS, PI, DAR · 3 → VV (verificación), CM, PR,
PQA · 4 → VV (validación) · 5 → CM, EST, MC · seguimiento → MC, RSK · cierre → MPM, PCM. Un área sin evidencia se declara «no evaluada»;
los porcentajes son un indicador interno, no una evaluación formal (`cumplimiento-cmmi-iso`).

## Checklist al iniciar un proyecto con esta metodología
- [ ] Registro de adaptación con los cinco ejes y su visto bueno.
- [ ] Roles asignados (quién hace, quién responde, a quién se consulta, a quién se informa).
- [ ] Frontera con el cliente acordada (ambientes, credenciales, quién despliega).
- [ ] Plan con línea base y ritmo de seguimiento.
- [ ] Matriz de trazabilidad creada desde el primer requerimiento.
