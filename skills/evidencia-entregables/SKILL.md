---
name: evidencia-entregables
description: "Evidencia real del escáner de seguridad, de las pruebas y del repositorio para los entregables de la metodología (requerimientos, especificación de campos, informe de verificación, informe de seguimiento, acta de cierre de etapa): qué entregable usa qué dato medido, cómo consultarlo sin inflar cifras (severidad efectiva, solo abiertos, categorías separadas, rama y commit), qué límites declarar y quién firma. Úsala SIEMPRE que un entregable cite seguridad, accesibilidad, calidad de código, pruebas o cumplimiento ISO/CMMI."
---

# Evidencia medida para los entregables

**El documento lo produce siempre `metodologia-entrega`** (plantillas y generador). Esta skill no genera documentos: dice de dónde salen los
datos de seguridad, pruebas y cumplimiento que se escriben en ellos y qué límites hay que declarar. Un dato medido lleva su fuente y fecha
de corte; la redacción de la IA se marca como tal; la decisión y la firma son siempre de una persona.

## Qué entregable usa qué evidencia
| Entregable (`metodologia-entrega/plantillas/`) | Evidencia medida | Límite que debe declarar |
| :--- | :--- | :--- |
| `22-especificacion-campos.md` | Catálogo de reglas de negocio (`reglas-negocio`): identificador y máscara de cada campo regido por una regla | Reglas inferidas o propuestas van «por confirmar»; no se inventan longitudes |
| `30-informe-verificacion.md` | **Salida literal** de la suite (comando y resumen `N passed`), cobertura, mutantes sobrevivientes (`pruebas-mutacion`), hallazgos del escáner abiertos por severidad efectiva | Solo con mocks ⇒ «Validado únicamente con mocks en aislamiento». Un análisis dinámico autenticado que no corrió se declara «no ejecutado» |
| `13-casos-aceptacion.md`, `40-registro-aceptacion.md` | Corridas de pruebas funcionales y hallazgos abiertos | La clasificación de lo que se encuentra (defecto · cambio de alcance · fuera de alcance) es decisión humana |
| `02-informe-seguimiento.md` | Avance = requisitos con pruebas aprobadas; hallazgos abiertos y vencidos por severidad; cumplimiento medido | Solo áreas verificadas; el resto `NO EVALUADO`. Nunca se calcula el avance por archivos creados |
| `90-acta-cierre-etapa.md` | Escaneo de la rama a cerrar, CI en verde, MR revisado por otra persona, release etiquetado, secretos abiertos | El escáner no firma ningún punto; los críticos los verifica la persona responsable de calidad |
| `52-acta-entrega.md` | Secretos abiertos en código e historial; SBOM de dependencias | Revisar el paquete entregado, que no es el repositorio |

## Consultar los datos de la forma correcta
- **Severidad efectiva:** la que fijó el análisis del caso, o la de la herramienta si no hay análisis. Se reportan ambas cuando difieren, con
  el motivo (sin riesgo confirmado, degradado, condicionado, revertido por un analista).
- **Separar categorías:** vulnerabilidades de seguridad, cumplimiento (accesibilidad WCAG: suele ser requisito legal, con plazo) e
  informativos (calidad y deuda). Nunca se suman en un solo «total de vulnerabilidades».
- **Solo abiertos:** se excluyen los resueltos y los suprimidos; los resueltos se informan aparte.
- **Rama y commit:** el entregable dice qué rama y qué commit se analizó y la fecha de corte.
- Los reportes del escáner (por activo, general y comparativo) son **fuente**, no sustituto: el entregable los resume y cita.

## Procedencia del análisis (obligatorio mencionarla)
1. **Análisis por hallazgo** (alguien o la IA revisó esa ocurrencia).
2. **Análisis de patrón** (explica la regla una vez; **no** revisó cada ocurrencia).
3. **Regla determinística** (texto fijo del motor).
La revisión humana convierte una recomendación en decisión; la IA nunca firma.

## Cumplimiento ISO 27001 / CMMI
- Los porcentajes que calcula una herramienta miden solo lo que tiene detector: lo demás es `NO EVALUADO`, no cumplido
  (`rules/common/compliance.md`, `cumplimiento-cmmi-iso`).
- Una plantilla existente o llena no vuelve «evaluada» un área: hace falta la instancia del artefacto con su evidencia y su revisión.
- Un entregable no afirma una cobertura mayor que la que publica la herramienta para cada marco.

## Antes de entregar un documento con evidencia medida
1. ¿Las cifras salen de una consulta real con fecha de corte, rama y commit, severidad efectiva y solo abiertos?
2. ¿Hay comandos y salidas reales (no resúmenes de memoria) donde se citan pruebas?
3. ¿Se declara lo **no ejecutado o no evaluado**? Un «0 hallazgos» solo significa algo donde el motor corrió.
4. ¿Se indica la procedencia del análisis?
5. ¿El archivo se guardó fuera de rutas públicas y sin secretos (nunca valores de llaves, contraseñas o tokens)?
6. ¿Pasó la **prueba de lectura**? Un agente sin el contexto de la sesión responde con el documento las preguntas que haría su lector
   (líder, cliente, auditor); lo que no pueda responder se corrige (`documentacion-codigo-y-api` §4).
