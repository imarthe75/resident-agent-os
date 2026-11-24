# Etapas: decisiones, roles y papel del agente

Roles genéricos (cada organización pone sus nombres): **Responsable del proyecto** (alcance, plan, cliente), **Analista** (requerimientos,
diseño funcional, aceptación), **Líder técnico / arquitecto** (arquitectura, catálogo tecnológico, excepciones), **Especialista de base de
datos** (modelo y cambios de esquema), **Desarrollo**, **Pruebas (QA)**, **Seguridad**, **Cliente / dueño funcional** (decide y firma),
**Soporte**. Notación: *Hace* · *Responde* · *Consulta a* · *Informa a* · *Firma*.

## 0 · Inicio y adaptación
- **Decisiones:** ¿se hace? · configuración de ciclo de vida, tipo de trabajo, base de arranque, interfaz, restricciones del contrato.
- **Roles:** Responsable del proyecto hace y responde; consulta al líder técnico; firma el cliente.
- **Agente:** resume la solicitud, propone riesgos iniciales; no decide si el proyecto procede.
- **CMMI:** PLAN, RSK (inicio), GOV (adaptación del proceso).

## 1 · Requerimientos
- **Decisiones:** qué casos de uso entran, sus reglas y criterios; requisitos del contrato no funcionales; estimación base.
- **Roles:** Analista hace; Responsable del proyecto responde; consulta a líder técnico (factibilidad); firma el cliente.
- **Entrada / salida:** proyecto aprobado → requerimientos firmados, matriz, estimación, casos de aceptación v1, plan base.
- **Agente:** revisa síntomas (fragmentación, colapso, criterio no comprobable, regla huérfana…), propone casos desde los criterios.
- **CMMI:** RDM, PLAN, EST; DAR si hay tecnología fuera de catálogo.

## 2 · Diseño
- **Decisiones:** arquitectura, integración, modelo de datos, componentes reutilizados, excepciones al catálogo.
- **Roles:** Líder técnico hace la arquitectura; especialista de BD el modelo; analista el diseño funcional; Responsable del proyecto
  responde; el cliente aprueba el prototipo.
- **Entrada / salida:** requerimientos aprobados → diseño aprobado y congelado (versión), cada elemento trazado a su requerimiento.
- **Agente:** propone ADR con alternativas, contratos de API y prototipo; no cierra excepciones.
- **CMMI:** TS, PI, DAR, refuerzo de RDM, GOV, PR, PQA.

## 3 · Construcción y verificación
- **Decisiones:** orden de construcción, criterios de «terminado», umbrales de calidad (cobertura, mutación, análisis de seguridad).
- **Roles:** Desarrollo hace; líder técnico responde; QA verifica; seguridad revisa.
- **Entrada / salida:** diseño aprobado → incremento en el repositorio con CI en verde, revisado por otra persona, pruebas y documentación.
- **Agente:** prueba primero, código y documentación en el mismo cambio, revisión con veredicto; nunca fusiona su propio trabajo.
- **CMMI:** VV (verificación), CM (versiones y esquema), PR, PQA, PI.

## 4 · Aceptación del usuario
- **Decisiones:** clasificación de cada hallazgo (defecto · cambio · zona gris) y si se acepta el incremento.
- **Roles:** el usuario ejecuta y registra; analista acompaña; Responsable del proyecto decide las zonas grises con el cliente; firma el cliente.
- **Entrada / salida:** incremento desplegado en aceptación + casos conciliados → acta de aceptación o lista de defectos.
- **Agente:** prepara datos ficticios y el orden de ejecución, clasifica con evidencia; no ejecuta por el usuario.
- **CMMI:** VV (validación), refuerzo de RDM, PQA, GOV.

## 5 · Despliegue y cierre
- **Decisiones:** fecha y ventana, criterio de reversa (rollback), inicio de garantía.
- **Roles:** quien es dueño del ambiente ejecuta; el equipo del proyecto asesora; Responsable del proyecto responde; firma el cliente.
- **Entrada / salida:** aceptación firmada → producción con runbook verificado y rollback probado, paquete de entrega sin credenciales,
  garantía iniciada, lecciones aprendidas desde la bitácora de seguimiento.
- **Agente:** redacta el runbook paso a paso con verificación por paso, el manual de usuario y las lecciones; no despliega fuera del canal.
- **CMMI:** CM (release), EST (estimado contra real), MC; enganche a MPM y PCM.

## S · Soporte y evolutivo
- **Decisiones:** tipo (incidente o servicio sin cambio), garantía o evolutivo, severidad, tamaño, plazo, motivo de cierre.
- **Roles:** Soporte hace y responde; especialista de BD da visto bueno si toca el esquema; el cliente confirma el cierre.
- **Agente:** diagnostica y propone clasificación y tamaño; en un servicio sin cambio no toca código, configuración, datos ni despliegue.
- Detalle (intake, tamaño, mini-diseño, cierre): `rules/common/delivery-process.md` §Soporte.
