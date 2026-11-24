# Guía técnica de implementación de un componente o módulo

Documento para **desarrolladores** que van a usar, extender o mantener un componente reutilizable o un módulo (no para el usuario
final). Es Markdown versionado junto al código (`docs/` o `documentacion/Manuales/arquitectura/`), no un `.docx`. Sigue la misma regla
que el manual de usuario: **describe lo que el código hace**, y cada afirmación lleva su `archivo:línea`.

## Encabezado obligatorio
```markdown
# <Componente> — Guía técnica de implementación
> **Sistema:** <sistema> · **Back:** <stack y versión> · **Front:** <stack y versión>
> **Pantalla de demostración:** <ruta> (si existe)
> **Audiencia:** <quién la usa y para qué>
> **Fuentes verificadas contra el código el <AAAA-MM-DD>.** Donde el código y la especificación difieren, manda el código y la
> diferencia queda en la sección «Diferencias entre la especificación y el código».
Rutas relativas a la raíz del repositorio (`back/…`, `front/…`).
```

## Secciones (en este orden; las que no apliquen se omiten, no se rellenan)
| # | Sección | Contenido |
|---|---|---|
| 1 | Qué resuelve y cuándo usarlo | Problema, cuándo sí y cuándo no usarlo |
| 2 | Arquitectura de un vistazo | Diagrama o lista de piezas (BD, back, front) y cómo se conectan |
| 3 | Decisiones de diseño | Tabla `# · Decisión · Consecuencia para quien implementa`; enlaza el ADR si existe |
| 4 | Modelo de datos | Tablas y columnas relevantes con su restricción (`UNIQUE`, `CHECK`, FK) y su changeset |
| 5 | Contrato del backend | DTOs, servicios, reglas que aplica y endpoints (método, ruta, permiso, respuestas) |
| 6 | Contrato del frontend | Archivos, API del componente (entradas, salidas, configuración) y comportamiento visible |
| 7 | Guía paso a paso | Checklist numerado para integrarlo en una entidad o pantalla nueva: BD → entidad → DTO → servicio → front → mostrar |
| 8 | Casos y funciones avanzadas | Variantes reales soportadas por el código |
| 9 | Permisos, menú y errores frecuentes | Permisos exactos, alta de menú y tabla `síntoma · causa · solución` |
| 10 | Pruebas y puesta en marcha | Pruebas que existen (con su comando) y verificación manual mínima |
| 11 | Diferencias entre la especificación y el código | Cada diferencia con su evidencia; la decisión es del líder técnico o del analista |
| 12 | Mapa de archivos | Tabla `archivo · responsabilidad` |

## Cómo se produce
1. **Evidencia:** `node scripts/evidencia.js --repo <raíz> --front <ruta del componente> --back <Prefijo> --out <trabajo>/evidencia.md`
   (mismo índice que el manual de usuario).
2. **Redacción:** cada regla, decisión o endpoint se escribe después de abrir su archivo en la línea citada. Nada sale de la memoria del
   agente ni de la especificación sin contrastar.
3. **Diferencias:** lo que la especificación dice y el código no hace (o al revés) va a la sección 11, nunca se «corrige» en el texto.
4. **Verificación:** antes de entregar, se comprueba que cada `archivo:línea` citado existe (`grep -n`) y se hace la prueba de lectura de
   `documentacion-codigo-y-api` §4 con preguntas reales de un desarrollador («¿cómo lo agrego a la entidad X?», «¿qué permiso pide?»).
5. **Redacción como versión original:** fecha de verificación en el encabezado, sin «antes/ahora»; si el código cambia, se vuelve a verificar
   y se actualiza la fecha.

## Prohibido
Credenciales, URL con tokens, datos personales reales, rutas locales de un equipo (`D:\…`, `/home/…`) y afirmaciones sin evidencia.
