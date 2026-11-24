# Observabilidad desde el diseño

Una prueba demuestra que algo funciona en el ambiente de pruebas; la observabilidad, que sigue funcionando en producción. Se diseña con el
requisito, no se agrega después de un incidente.

## En la especificación
- Cada requisito funcional dice qué señal lo demuestra en ejecución (métrica, traza, log estructurado o evento de auditoría), dónde se ve
  y cuándo alerta (sección «Observabilidad» de la plantilla de spec). Un requisito sin señal solo está probado en el ambiente de pruebas.

## En todo backend (verificador `observability_min`)
1. **Health check:** Actuator en Spring Boot (`/actuator/health`), o una ruta `/health`, `/ready` o `/live`. Distingue «el servicio no
   responde» de «el servicio responde con error», y es lo que consultan el balanceador y el orquestador.
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
   se puede comparar entre proveedores ni alertar.
