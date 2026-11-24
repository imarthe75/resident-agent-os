# Observabilidad desde el diseño

Una prueba demuestra que algo funciona en el ambiente de pruebas; la observabilidad, que sigue funcionando en producción. Se diseña con el
requisito, no se agrega después de un incidente.

## En la especificación
- Cada requisito funcional dice qué señal lo demuestra en ejecución (métrica, traza, log estructurado o evento de auditoría), dónde se ve
  y cuándo alerta (sección «Observabilidad» de la plantilla de spec). Un requisito sin señal solo está probado en el ambiente de pruebas.

## En todo backend (verificador `observability_min`)
1. **Health check:** Actuator en Spring Boot (`/actuator/health`), o una ruta `/health`, `/ready` o `/live`. Distingue «el servicio no
   responde» de «el servicio responde con error», y es lo que consultan el balanceador y el orquestador.
   - **Vida y preparación separadas:** `/health` (o `liveness`) no consulta nada: solo dice que el proceso responde. `/health/ready` (o
     `readiness`) revisa la base y las dependencias. Un health check que consulta la base, un servicio lento o un modelo de IA convierte
     la latencia en reinicios del contenedor, o en una factura.
   - Una dependencia caída se responde con **503**, no con 500: el cliente sabe que puede reintentar.
2. **Id de correlación:** cada petición lleva un id (Micrometer Tracing, OpenTelemetry, o un filtro que lea o genere `X-Request-Id` /
   `traceparent` y lo ponga en el MDC o en el contexto del logger) que aparece en cada línea de log y se propaga a los servicios que llama.
   Sin él, un error no se puede seguir de un servicio a otro.

## Logs
3. **Estructurados (JSON)** con fecha y zona, nivel, id de correlación, servicio y mensaje: un log en texto libre no se puede filtrar ni
   contar. En Spring Boot 3.4+: `logging.structured.format.console=ecs` (o `logstash`); en Python: `structlog` o `python-json-logger`; en
   Node: `pino`.
4. **Nunca** contraseñas, tokens, llaves, datos personales completos ni cuerpos de petición con esos datos (`rules/common/security.md`).
5. Nivel según el lector: `ERROR` = alguien tiene que actuar; `WARN` = degradado pero sigue; `INFO` = eventos de negocio; `DEBUG` apagado
   en producción.

## Métricas y eventos
6. Los eventos de negocio que la especificación usa como señal (pedido creado, pago rechazado) se cuentan con una métrica o quedan en la
   bitácora de auditoría; no se reconstruyen leyendo logs de texto.
7. Las llamadas a servicios externos (incluidos modelos de IA) registran duración, resultado y, cuando aplica, costo: lo que no se mide no
   se puede comparar entre proveedores ni alertar. Para funciones que llaman a un modelo, ver `ai-features.md`.

## Señales de producción y alertas
8. Cuatro señales por petición, salidas de **un** evento que emite el middleware (así cuentan también las que fallan antes de llegar al
   controlador): latencia (promedio y **p95**: el promedio esconde la cola), costo (si llama a servicios de pago o a modelos), tasa de error
   (no 2xx) y, en funciones con IA, tasa de abstención («no tengo suficiente información»). Las sondas de health check no se cuentan.
9. **Umbrales de alerta fijos y escritos** (p95 en ms, costo por petición, % de errores), sacados de datos medidos y no de intuición; un
   número escrito se puede discutir en una revisión. Sin umbral, la señal se declara «no monitoreada». El tablero o script que los revisa
   termina con código distinto de cero al superarlos, para que lo pueda correr un cron o el CI.
10. **Un fallo real en producción se convierte en un caso de prueba permanente** (de regresión o del conjunto de evaluación), para que no
    vuelva a pasar sin que se note.
