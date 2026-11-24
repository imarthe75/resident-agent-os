# Registro de decisión de arquitectura

| Control | |
|---|---|
| Proyecto | Sistema de citas (ejemplo) |
| Documento | Registro de decisión de arquitectura |
| Etapa | 2 · Diseño |
| Versión | 1.0 |
| Fecha | 2026-11-24 |
| Elaboró | Agente de IA (borrador) y Líder técnico |
| Revisó | Líder técnico |
| Estado | Aprobado |

## Contexto
> Llena: IA (revisión obligatoria)

El envío de confirmaciones por correo tarda hasta 8 s y hoy ocurre dentro de la petición de reservar cita (RF-03); cuando el servidor de
correo falla, la reserva falla aunque la cita sí se guardó.

Revisó: Líder técnico · 2026-11-24

## Opciones consideradas
> Llena: IA (revisión obligatoria)

| Opción | A favor | En contra |
|---|---|---|
| Envío asíncrono con cola en la base (tabla de trabajos) | Sin infraestructura nueva; reintentos y trazabilidad en la misma transacción | Más carga en la base |
| Broker de mensajes dedicado | Escala mejor | Servicio nuevo que operar; fuera del catálogo tecnológico |

Revisó: Líder técnico · 2026-11-24

## Decisión
> Llena: persona

Cola en la base de datos: el volumen esperado (500 correos al día) no justifica un servicio nuevo.

## Consecuencias
> Llena: IA (revisión obligatoria)

- La reserva responde sin esperar al correo; el correo se reintenta 3 veces y queda registrado si falla.
- Hay que vigilar el crecimiento de la tabla de trabajos (depuración mensual).

Revisó: Líder técnico · 2026-11-24

## Requerimientos relacionados
> Llena: derivado de la matriz de trazabilidad

- RF-03, RNF-02

## Firmas
> Llena: persona

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Líder técnico | | | |
