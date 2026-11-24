# Funciones construidas con modelos de IA

Aplica a un proyecto que **llama a un modelo** como parte del producto (clasificar, resumir, estimar, responder). No aplica al uso de un
asistente para programar.

## Pruebas y evaluación son cosas distintas
1. **El CI nunca llama al modelo:** debe dar el mismo resultado para el mismo commit, terminar rápido, no agotar cuotas ni cobrar en cada
   push. En pruebas, el modelo se sustituye por un doble (cliente falso, respuestas grabadas). La llave en el CI es ficticia.
2. **La calidad del modelo se mide aparte**, con un conjunto de evaluación (golden set) que corre bajo demanda o por la noche, contra el
   servicio desplegado en un ambiente de pruebas:
   - Cada caso tiene la entrada, el resultado esperado como **rango aceptable** (no un número exacto) y cómo se derivó.
   - Al menos un caso donde la respuesta correcta es **abstenerse** («información insuficiente»): mide que el sistema no invente.
   - El arnés guarda cada corrida con fecha (`eval/reports/…json`); la serie de corridas es el entregable. Termina con código distinto de
     cero si un caso falla, para usarse como compuerta de regresión.
   - Métricas mínimas: casos dentro de rango, error medio, abstención correcta, latencia p95 y, si cita fuentes, citas válidas.
3. Una comparación A/B cambia **una sola variable** a la vez (modelo, o prompt, o caché), y reparte las peticiones por hash del id, no al
   azar: un reintento cae en el mismo brazo.

## Diseño
4. **Lo que es aritmética no lo calcula el modelo:** precios, totales, fechas y conversiones se calculan en código. El modelo propone; el
   código calcula.
5. **Sin precedente, sin número:** si no hay datos suficientes, el sistema lo dice en lugar de dar una cifra con apariencia de certeza.
6. **Una salida dudosa se marca, no se descarta:** si el resultado ya se pagó, se entrega con `requiere_revision_humana` en lugar de
   rechazarlo; rechazar convierte un problema de calidad en una caída. Las decisiones con consecuencias pasan por una persona (puerta
   humana) antes de seguir.
7. Un solo módulo habla con el proveedor del modelo (cliente compatible con la API de OpenAI o equivalente); cambiar de proveedor o
   pasar a un modelo propio es cambiar una URL, no reescribir llamadas.
8. Los datos personales se detectan antes de enviar el texto al modelo: se rechazan o se reportan según la ruta, nunca se ignoran.

## Costo y observabilidad
9. Costo por petición y **por etapa** (tokens × precio del modelo), incluidas las etapas que fallaron: un reintento también cuesta.
10. El nombre del modelo se resuelve contra la tabla de precios por prefijo más largo; un modelo sin precio no puede registrar costo 0 en
    silencio: se reporta. Un costo que salta sin cambio de tráfico indica un cambio de prompt o de modelo.
11. Las señales y umbrales de `observability.md` aplican; la tasa de abstención se lee junto con la de errores (más abstención = el
    sistema es prudente; más errores = está roto).
