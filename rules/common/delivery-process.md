# Proceso de entrega: requerimientos, diseño, pruebas y soporte

Prácticas que el agente aplica cuando ayuda a analistas, diseñadores, testers o al equipo de soporte. Si el proyecto tiene una metodología
propia, gana la del proyecto; esta regla cubre lo que no diga.

## Límites del agente
- El agente propone; una persona valida. Lo que redacta la IA en un documento formal lleva una marca visible de revisión humana; la IA no
  llena firmas, fechas de sesión, decisiones ni montos.
- Nunca se cargan a un modelo datos reales del cliente (registros, nombres, expedientes, capturas sin anonimizar): los ejemplos se inventan.
- La referencia es siempre algo **aprobado** (criterio de aceptación, regla de negocio, diseño firmado). Sin un acuerdo que lo respalde, lo que
  «se ve mal» es una observación, no un defecto.
- Lo nuevo que pide el cliente durante una sesión va a control de cambios; no se acepta en silencio.

## Requerimientos
Unidad: el caso de uso con valor de negocio. Seis campos:
1. **Nombre:** verbo + resultado de negocio, nunca una pantalla o un botón.
2. **Actor:** el rol que ejecuta la acción; quien solo consulta o recibe el resultado es un interesado.
3. **Camino principal:** pasos numerados en infinitivo, del inicio al resultado, cuando todo sale bien.
4. **Alternos:** desvíos, rechazos y errores, cada uno con el paso donde se separa. Por cada regla: ¿qué pasa si no se cumple?
5. **Reglas de negocio:** cada una se ejerce en algún paso (ver `business-rules.md`).
6. **Criterios de aceptación:** comprobables por alguien ajeno sin opinar (nada de «rápido», «fácil», «amigable»).

Síntomas a buscar al revisar: fragmentación (dos requerimientos que solo difieren en un paso), colapso (dos actores o dos grupos de reglas que
no se tocan), actor confundido con interesado, criterio no comprobable, condición «si…» escondida en el camino, regla huérfana (no se ejerce
en ningún paso), regla duplicada (vive en uno; el otro la cita), flujo feliz sin alternos, requisito no funcional disfrazado de requerimiento,
y diseño adelantado (formatos, longitudes o mensajes dentro del requerimiento).

## Diseño funcional
- No se diseña sobre un requerimiento incompleto. Se diseñan errores y alternos, no solo el camino feliz, con los componentes del proyecto.
- Si identidad visual y accesibilidad chocan, se decide y registra. Un requerimiento que cambia se corrige en la matriz de trazabilidad,
  no solo en la pantalla; la versión aprobada se congela.
- Cada regla de negocio dice en qué campo se valida; las validaciones institucionales (identificadores fiscales, de población…) se
  reutilizan, no se reescriben; las longitudes se concilian con quien diseña la base de datos. Las dudas se resuelven por escrito.

## Pruebas y aceptación
- Primero lo crítico para el negocio; cada alterno y cada regla con su caso; cada caso con el usuario de su actor, nunca con un
  administrador que todo lo puede; no se prueba lo que no está listo (sin revisión, sin pruebas en verde o sin desplegar).
- Un hallazgo reproducible lleva pasos, datos, usuario y evidencia. Lo que parece error puede ser una regla intencional del cliente.
- Revalidar = la corrección y lo que la rodea. Si la corrección falla, se reabre el mismo defecto.
- Solo el responsable del proyecto recorta pruebas, y el recorte queda escrito con su motivo.
- En la prueba de aceptación el usuario ejecuta y registra. Contradice un criterio aprobado → defecto; pide algo que ningún criterio cubre →
  cambio; una zona gris se presenta con sus dos lecturas y la decide quien corresponde.

## Soporte
- Sin el mínimo de información (componente, descripción, pasos para reproducir, impacto) no se abre ticket; el plazo corre desde el registro.
- El tipo lo decide una pregunta: **¿cambia el sistema?**
  - **Incidente:** se clasifica (garantía o evolutivo, severidad, tamaño, plazo). Un reporte que mezcla defecto y alcance nuevo se parte en
    dos tickets ligados.
  - **Servicio sin cambio** (consulta, diagnóstico, asesoría, capacitación, documentación): **no toca código, configuración, datos ni
    despliegue**. Si en el camino hace falta un cambio, se abre un incidente ligado. Un agente en este tipo de ticket no aplica cambios.
- **Tamaño:** pequeño (sin decisión de diseño) / mediano (requiere una decisión de diseño → mini-diseño con evidencia de pruebas del
  componente y visto bueno de quien diseña la base de datos si toca el esquema) / grande (arquitectura o funcionalidad nueva → entra como
  proyecto). Decide el propósito, no la superficie: tocar el esquema no vuelve grande un cambio.
- Todo ticket cierra con un solo motivo: por corrección, sin defecto confirmado, no reproducible, no procede, o derivado a evolutivo.
