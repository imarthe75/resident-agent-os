# Plantillas de la metodología de entrega

Una plantilla en Markdown por entregable. Se copian al proyecto (`docs/entregables/<etapa>/`), se llenan con datos reales y se
versionan con el código; los cambios se revisan en el merge request como cualquier otro.

## Convención (la usan las personas, el agente y el generador de `.docx`)
- **Encabezado:** la tabla de control inicial (proyecto, documento, versión, fecha, elaboró, revisó, estado). La versión inicial es 1.0 y el
  documento describe el estado vigente, sin «antes/ahora».
- **Quién llena cada sección:** la línea `> Llena: …` debajo del título.
  | Marca | Significa |
  |---|---|
  | `> Llena: persona` | Decisiones, firmas, fechas de sesión, montos y alcance. **El agente nunca la llena.** |
  | `> Llena: IA (revisión obligatoria)` | El agente redacta; una persona revisa y anota «Revisó: <nombre> · <fecha>» al final de la sección. |
  | `> Llena: derivado de <fuente>` | Se copia o calcula de otro artefacto o del sistema; nunca se inventa. |
- **Pendientes:** todo lo que falta va entre comillas latinas, `«…»`. Un documento entregable no tiene ninguno; si un dato no existe, se
  escribe `no aplica: <motivo>` o `sin definición documentada` (sin comillas latinas).
- **Firmas:** la tabla de firmas va siempre en blanco; la firma es de una persona.
- **Datos:** nunca credenciales, datos personales reales ni capturas sin anonimizar.

## Catálogo
| Etapa | Plantilla | Entregable |
|---|---|---|
| 0 | `00-registro-adaptacion.md` | Registro de adaptación (tailoring) |
| 0 | `01-plan-proyecto.md` | Plan del proyecto (alcance, RACI, calendario, riesgos) |
| Seguimiento | `02-informe-seguimiento.md` | Informe periódico de avance |
| Seguimiento | `03-solicitud-cambio.md` | Solicitud y análisis de cambio |
| 1 | `10-requerimientos.md` | Especificación de requerimientos (seis campos) y requisitos no funcionales |
| 1 | `11-matriz-trazabilidad.md` | Matriz de trazabilidad |
| 1 | `12-estimacion.md` | Estimación |
| 1 | `13-casos-aceptacion.md` | Casos de aceptación |
| 2 | `20-adr.md` | Registro de decisión de arquitectura (ADR) |
| 2 | `21-diseno-tecnico.md` | Diseño técnico (arquitectura, datos, contratos de API) |
| 2 | `22-especificacion-campos.md` | Especificación de campos y validaciones (con interfaz) |
| 3 | `30-informe-verificacion.md` | Informe de verificación del incremento |
| 4 | `40-registro-aceptacion.md` | Registro de ejecución de la aceptación y clasificación de hallazgos |
| 4 | `41-acta-aceptacion.md` | Acta de aceptación |
| 5 | `50-runbook-despliegue.md` | Runbook verificable de despliegue |
| 5 | `51-evidencia-rollback.md` | Evidencia de rollback probado |
| 5 | `52-acta-entrega.md` | Acta de despliegue y entrega (inicio de garantía) |
| 5 | `53-lecciones-aprendidas.md` | Lecciones aprendidas |
| Soporte | `60-ticket-soporte.md` | Ticket: registro, clasificación y cierre |
| Soporte | `61-mini-diseno.md` | Mini-diseño de un cambio mediano |
| Todas | `90-acta-cierre-etapa.md` | Acta de cierre de etapa (compuerta) |

Verificación antes de entregar: `python3 scripts/verificar_entregable.py <documento.md>` (pendientes, revisión de lo redactado por IA,
secciones obligatorias de la plantilla).
