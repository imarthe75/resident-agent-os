# Estructura y redacción del manual de usuario de módulo

El **builder** decide el formato, los estilos y la numeración. Aquí está lo que la IA decide: **qué** escribir y **cómo** redactarlo.

## Esqueleto (lo arma `build_manual.js`)

| # | Sección | Payload |
|---|---|---|
| — | Portada: ORGANIZACIÓN (de `references/marca.json`) · MANUAL DE USUARIO · Módulo · tabla Sistema/Cliente/Fecha | `modulo`, `sistema`, `cliente`, `_control.fecha` |
| — | Índice de contenido (se actualiza al abrir en Word) | — |
| 1 | Información general | `sistema`, `cliente`, `clave_proyecto`, `modulo`, `_control` |
| 2 | Introducción · Objetivo · Público / rol usuario · ¿Para qué sirve? · [conceptos] | `descripcion[]`, `objetivo`, `publico`, `para_que_sirve[]`, `concepto[]` |
| 3 | Acceso al sistema (URL, navegadores, resolución, conexión, perfil, credenciales) | `url_acceso`, `conexion`, `perfil_requerido` (+ valores fijos) |
| 4 | Módulos del sistema · <módulo> · Ubicación · Tabla de funcionalidades · Procedimiento 4.1…4.n · [Mensajes del sistema] | `ubicacion_menu`, `funcionalidad[]`, `tarea[]`, `mensaje[]` |
| (5) | Consideraciones (solo si hay) | `consideraciones[]` |
| n | Preguntas frecuentes | `pregunta[]` |
| n+1 | Glosario de términos | `termino[]` |
| n+2 | Aprobaciones (la firma va siempre en blanco) | `_control.aprobador` |
| n+3 | Control de versiones | `_control` (`historial[]` opcional) |

Encabezado: «<Organización> — Manual de Usuario». Pie: «<código del documento> · <sistema> · <módulo> — Página N de M», **derivado** (nunca se escribe a mano). Organización y código salen de `references/marca.json`.

## Orden de las tareas (como en los manuales vigentes)

1. **Acceso al módulo**: menú hamburguesa → opción; y, si existe, la tarjeta en la pantalla de Inicio.
2. **Consulta y filtrado**: Mostrar filtros → capturar criterios → Aplicar filtros → Limpiar filtros → búsqueda rápida → paginado.
3. **Activar / inactivar**.
4. **Agregar** (alta).
5. **Editar**.
6. **Eliminar**, solo si su regla es citable, y **Reactivar o restablecer** un eliminado.
7. Acciones propias del módulo (asignar roles, asignar menús, descargar…).
8. **Información del módulo y manual de usuario**: botón «i» → descripción → «Descargar manual de usuario». Solo si el sistema tiene ese componente.

## Redacción

- **Pasos:** infinitivo impersonal, una acción por paso. «Pulsar el botón Guardar.» «Seleccionar la opción Usuarios.» «Capturar el nombre.» Los resultados del sistema van en presente: «El sistema muestra…».
- **Nombres exactos** de botones, campos, menús y títulos, copiados del front (evidencia o exploración). Si el botón dice «+ Agregar usuario», el paso dice «+ Agregar usuario».
- **No numeres** pasos ni figuras, ni pongas «Figura N» en el pie: el builder numera de forma continua en todo el documento.
- **Pie de figura:** describe lo que se ve, con punto final. «Botón Guardar para confirmar la edición.»
- **Un paso que cambia la pantalla lleva captura.** Los pasos de texto puro («Para volver al listado completo, pulsar Limpiar filtros») pueden ir sin captura.
- **«Importante:»** (`tarea.reglas`): reglas que limitan lo que el usuario puede hacer, siempre con `[RN-xx]`. Redáctalas para el usuario («El nombre solo acepta letras y guion bajo»), no para el desarrollador («regex ^[A-Z_]+$»).
- **«Nota importante:»** (`paso.nota`): una advertencia ligada a ese paso (duplicados, efectos secundarios).
- **Mensajes del sistema:** texto **literal** de la evidencia. Las variables se sustituyen por `<NOMBRE>`. No se corrige la ortografía del sistema («Maximo»): si está mal, se reporta como hallazgo.
- **Preguntas frecuentes:** de dudas reales o de reglas no obvias (inactivar contra eliminar, reactivar, qué pasa con los dependientes). Entre 3 y 15.
- **Glosario:** términos del negocio y de la pantalla. Nada de jerga técnica.
- **Prohibido:** endpoints, nombres de tablas, DTOs, «caché», «backend»; credenciales; datos personales reales; meta-tokens (`[Probable]`, `«...»`, «como IA»).

## Lo que NO es este manual

Arquitectura, instalación o despliegue (como el «Manual tecnológico superset»): eso es un manual técnico, otra plantilla. Tampoco es una guía de pruebas.
