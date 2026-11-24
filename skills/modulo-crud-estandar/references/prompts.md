# Prompts para generar un Módulo X con una herramienta de IA

Copia la plantilla que corresponda, llena los corchetes y entrégala junto con esta skill (`modulo-crud-estandar`) y las reglas del proyecto
(`AGENTS.md`). Una sola plantilla por pedido.

## A. Con documento de análisis y diseño

```markdown
Lee completa la skill `modulo-crud-estandar` (y las skills que cita para cada capa) y el documento de análisis y diseño
`[ruta/al/documento_analisis_y_diseno.md]`.

Implementa el módulo `[Nombre del módulo]` con alcance `[Completo (BD + backend + frontend) | Solo backend + BD | Solo frontend]`.
Toma del documento los campos, validaciones, reglas de negocio, relaciones, filtros y acciones.

- Recurso API / ruta frontend: `/api/[recurso]` | `/[ruta]`
- Tabla: `public.[tabla]`
- Prefijo de privilegios: `[MODULO]`
- Registros protegidos del sistema: `[No aplica | Sí: cuáles y qué acciones]`

Reglas:
1. Si detectas una ambigüedad crítica (campos, tipos, reglas), pregúntame antes de escribir código; si todo está claro, presenta un plan breve
   con los archivos a crear o modificar y procede.
2. No copies los patrones de módulos viejos listados en la skill (§5).
3. Al terminar, entrega la lista de archivos creados o modificados y la salida real de las validaciones ejecutadas
   (`./gradlew test --tests "*[Entidad]*"`, `npm run build`); lo que no pudiste ejecutar, dilo como «no verificado».
```

## B. Con requisitos dados por el desarrollador

```markdown
Lee completa la skill `modulo-crud-estandar` (y las skills que cita para cada capa).

Implementa el módulo `[Nombre del módulo]` con alcance `[Completo (BD + backend + frontend) | Solo backend + BD | Solo frontend]`:

- Propósito: [qué administra el módulo]
- Recurso API / ruta frontend: `/api/[recurso]` | `/[ruta]`
- Tabla: `public.[tabla]`
- Prefijo de privilegios: `[MODULO]`
- Campos:
  - `[campo_1]`: [tipo, longitud, obligatorio/opcional, único sí/no, inmutable al editar sí/no, mayúsculas/minúsculas]
  - `[campo_2]`: [...]
- Relaciones: [Ninguna | FK a `[tabla]`, opciones por lista corta o búsqueda en servidor]
- Quién puede ver o editar cada registro: [todos con el permiso | solo su unidad | solo el dueño]
- Columnas de la tabla: [campo_1, campo_2, Estatus, Acciones]
- Filtros avanzados: [campo_1, Estatus] + búsqueda global `textoLibre`
- Acciones: [Cambiar estatus, Consultar, Editar, Eliminar, Restablecer ante 409] + [otras]
- Registros protegidos del sistema: `[No aplica | Sí: cuáles y qué acciones]`
- Reglas de negocio propias: [cuáles]

Reglas:
1. Si detectas una ambigüedad crítica (campos, tipos, reglas), pregúntame antes de escribir código; si todo está claro, presenta un plan breve
   con los archivos a crear o modificar y procede.
2. No copies los patrones de módulos viejos listados en la skill (§5).
3. Al terminar, entrega la lista de archivos creados o modificados y la salida real de las validaciones ejecutadas
   (`./gradlew test --tests "*[Entidad]*"`, `npm run build`); lo que no pudiste ejecutar, dilo como «no verificado».
```
