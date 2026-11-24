# Diseño técnico

| Control | |
|---|---|
| Proyecto | «nombre del proyecto» |
| Documento | Diseño técnico |
| Etapa | 2 · Diseño |
| Versión | 1.0 |
| Fecha | «AAAA-MM-DD» |
| Elaboró | «nombre y rol» |
| Revisó | «nombre y rol» |
| Estado | Borrador · Aprobado |

## Arquitectura
> Llena: IA (revisión obligatoria)

«Componentes, cómo se comunican y dónde corre cada uno (diagrama o lista).» Decisiones: ver los ADR «…».

## Modelo de datos
> Llena: IA (revisión obligatoria)

| Tabla | Propósito | Llave | Relaciones | Restricciones (UNIQUE, CHECK) |
|---|---|---|---|---|
| «…» | «…» | «uuid» | «…» | «…» |

Visto bueno del especialista de base de datos: «nombre · fecha».

## Contratos de API
> Llena: derivado de el contrato OpenAPI del repositorio

| Método y ruta | Permiso | Respuestas | Requerimiento |
|---|---|---|---|
| «POST /api/…» | «…» | «201 · 400 · 403 · 409» | «RF-xx» |

## Integraciones
> Llena: IA (revisión obligatoria)

| Sistema | Dirección | Protocolo | Autenticación | Manejo de fallas |
|---|---|---|---|---|
| «…» | «entrada · salida» | «…» | «sin credenciales en este documento» | «reintento, cola, alerta» |

## Seguridad
> Llena: IA (revisión obligatoria)

«Autenticación, autorización por acción y por propiedad del recurso, datos sensibles, registro de auditoría.»

## Trazabilidad
> Llena: derivado de la matriz de trazabilidad

Cada elemento de este documento cita su requerimiento.

## Firmas
> Llena: persona

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Líder técnico | | | |
| Responsable del proyecto | | | |
