---
skill: generacion-componentes-html
description: Guía canónica para generar, extender o modificar plantillas HTML de componentes interactivos, priorizando PrimeNG (v21), utilidades de Tailwind CSS y convenciones de UI establecidas en el proyecto.
---

# Spec: Generación de Componentes HTML (PrimeNG + UI)

## Propósito

Este documento define la estructura visual, patrones de componentes y clases CSS permitidas para generar o modificar plantillas HTML de componentes Angular.

> **Objetivo visual:** Mantener uniformidad en toda la aplicación. Las grillas, formularios, tablas y modales deben lucir y comportarse de forma idéntica en cualquier módulo.

---

## 1. Prioridad de Librerías (Regla de Oro)

**Siempre se debe favorecer un componente de PrimeNG frente a código HTML nativo.**

- Sí: `<p-button>`, `<p-dropdown>`, `<p-calendar>`, `<p-table>`.
- No: `<button class="btn">`, `<select>`, `<input type="date">`, `<table>`.

---

## 2. Convenciones de Layout (Tailwind CSS)

El proyecto usa **Tailwind CSS** (con `tailwindcss-primeui`) para layout y espaciado. **PrimeFlex y Bootstrap fueron retirados del proyecto**; sus clases ya no renderizan nada.

> ⛔ **PROHIBIDO usar clases de PrimeFlex / Bootstrap.** Son la causa #1 de estilos que "no se aplican". Usa siempre el equivalente de Tailwind. Referencia oficial: https://tailwindcss.com/docs (en especial [Flexbox & Grid](https://tailwindcss.com/docs/flex)).

| ❌ PrimeFlex / Bootstrap | ✅ Tailwind |
|---|---|
| `align-items-center` | `items-center` |
| `align-items-start` / `align-items-end` | `items-start` / `items-end` |
| `justify-content-between` | `justify-between` |
| `justify-content-center` / `-end` / `-evenly` | `justify-center` / `justify-end` / `justify-evenly` |
| `flex-column` | `flex-col` |
| `col-12`, `col-8`, `col-6`, `col` (grid) | `w-full`, `grid grid-cols-12` + `col-span-*`, o `flex-1` |
| `surface-100` … `surface-900` | `bg-surface-100` … `bg-surface-900` |
| `text-color-secondary` | `text-muted-color` |
| `border-circle` | `rounded-full` |
| `border-round` | `rounded` |
| `shadow-1` / `shadow-2` … | `shadow` / `shadow-md` … |
| `z-1` | `z-10` |
| `w-1rem` / `h-2rem` (rem fijos) | `w-4` / `h-8` (escala) o `w-[40rem]` (arbitrario) |

> El **espaciado** (`p-*`, `m-*`, `px-*`, `gap-*`, `my-4`…) usa la **misma** nomenclatura en ambas librerías, así que no requiere conversión. El problema se concentra en **flexbox, grid, colores (`surface`) y utilidades de forma/sombra**.

### 2.1 Encabezados de página

El título principal de una vista siempre agrupa su título y su acción principal (si existe) en un wrapper flex:

```html
<!-- ✔️ CORRECTO -->
<div class="flex items-center justify-between my-4">
  <div class="titulo">
    <h1>Título de la Página</h1>
  </div>

  <!-- Botón de acción principal (crear) alineado a la derecha -->
  <div class="flex justify-end">
    <p-button
      type="button"
      icon="pi pi-plus"
      iconPos="left"
      label="Nuevo Registro"
      (click)="abrirModalCrear()"
    >
    </p-button>
  </div>
</div>
```

---

## 3. Estructura de Filtros de Búsqueda y Formularios

### 3.1 Contenedor Principal Flex

Los formularios o barras de filtros **deben** ir envueltos en un contenedor flex responsivo:

```html
<form
  [formGroup]="miFormulario"
  class="flex items-center justify-evenly flex-wrap gap-2 my-5"
  (ngSubmit)="buscarDatos()"
>
  ...
</form>
```

### 3.2 Campos de Formulario (`input-container`)

_Obligatorio:_ Todo input (texto, p-select en actualización del dropdown de versiones anteriores, p-datepicker en actualización del calendar, p-inputnumber en actualización del inputnumber) debe ir dentro de un `div class="input-container"`. Esto estandariza la altura, ancho y los mensajes de error.
Igualmente deberá contener una etiqueta `<label>` y un mensaje de error `<small>` si es necesario, así como un `placeholder` que guie al usuario sobre el dato que debe ingresar.

```html
<!-- Input Text Estándar -->
<div class="input-container">
  <label for="campoDeTexto">Etiqueta del campo</label>
  <input
    pInputText
    id="campoDeTexto"
    type="text"
    class="w-full"
    formControlName="campoDeTexto"
    placeholder="Ingrese el valor"
  />
  <!-- Mensaje de error: usar el componente reutilizable (ver §3.2.2) -->
  <app-error-input [control]="miFormulario.get('campo')" />
</div>

<!-- Dropdown (PrimeNG 20: p-select) -->
<div class="input-container">
  <label for="opciones">Opciones de Filtro</label>
  <p-select
    id="opciones"
    class="w-full-dropdown"
    [options]="listaOpciones"
    formControlName="opciones"
    optionLabel="descripcion"
    optionValue="id"
    [showClear]="true"
    [filter]="true"
    filterBy="descripcion"
    placeholder="Seleccione..."
    appendTo="body"
  >
  </p-select>
  <!-- Mensaje de error: usar el componente reutilizable (ver §3.2.2) -->
  <app-error-input [control]="miFormulario.get('campo')" />
</div>

<!-- Fecha desde (PrimeNG 20: p-datepicker) -->
<div class="input-container">
  <label for="fechaDesde">Desde</label>
  <p-datepicker
    id="fechaDesde"
    dateFormat="dd/mm/yy"
    class="w-full"
    styleClass="w-full"
    formControlName="fechaDesde"
    fluid
    showClear="true"
    placeholder="dd/mm/yyyy"
    [showIcon]="true"
    appendTo="body"
  >
  </p-datepicker>
  <!-- Mensaje de error: usar el componente reutilizable (ver §3.2.2) -->
  <app-error-input [control]="miFormulario.get('campo')" />
</div>
```

> **Nota de usabilidad:** Los Dropdowns (`<p-select>`) deben llevar siempre `[showClear]="true"`, `[filter]="true"` (si hay más de 5 elementos), y `appendTo="body"` para evitar que la lista quede cortada por `overflow: hidden` de su contenedor.

### 3.2.1 Capitalización de campos (Regla de Negocio)

_Obligatorio:_ En **todos** los módulos del proyecto, ciertos campos de texto se normalizan automáticamente:

- **Nombre → siempre MAYÚSCULAS.** Aplicar la directiva `appMayusculas`.
- **Correo electrónico → siempre minúsculas.** Aplicar la directiva `appMinusculas`.

Las directivas viven en `src/app/core/directives/` (`mayusculas.directive.ts` / `minusculas.directive.ts`), son standalone y transforman el valor conforme el usuario escribe o pega, sincronizando el `FormControl` y el DOM. Se aplican **declarativamente** en el `<input>`, sin lógica adicional en el `.ts`.

```html
<!-- Nombre: se almacena en MAYÚSCULAS -->
<div class="input-container">
  <label for="nombre">Nombre</label>
  <input
    pInputText
    appMayusculas
    id="nombre"
    type="text"
    class="w-full"
    formControlName="nombre"
    placeholder="Ej. PEDRO"
  />
</div>

<!-- Correo: se almacena en minúsculas -->
<div class="input-container">
  <label for="correo">Correo electrónico</label>
  <input
    pInputText
    appMinusculas
    id="correo"
    type="text"
    class="w-full"
    formControlName="correo"
    placeholder="correo@ejemplo.com"
  />
</div>
```

> **Recuerda:** importar `MayusculasDirective` y/o `MinusculasDirective` en el array `imports` del componente standalone (ver skill de TS). La regla aplica tanto a formularios de alta/edición como a filtros de búsqueda por nombre (para que la búsqueda case con los datos).

### 3.2.2 Mensajes de error de campo (`<app-error-input>`)

_Obligatorio:_ El mensaje de error de un campo inválido **NO se escribe a mano** con un `<small>` por campo (genera texto inconsistente y se olvida el guard de interacción). Se usa el componente reutilizable `app-error-input` de `src/app/shared/components/error-input/`, que recibe el `FormControl`, deriva el mensaje en Español (MX) de forma centralizada y solo se muestra cuando el control es inválido y el usuario ya interactuó (`touched`/`dirty`).

```html
<div class="input-container">
  <label for="nombre">Nombre</label>
  <input pInputText appMayusculas id="nombre" formControlName="nombre" class="w-full" placeholder="Ej. PEDRO" />
  <app-error-input [control]="formGuardar.get('nombre')" />
</div>
```

> **Notas:**
> - Importar `ErrorInputComponent` en el array `imports` del componente standalone.
> - El componente renderiza `<small class="block text-red-500 text-sm">` internamente; **no** repliques esa clase manualmente.
> - Para agregar o ajustar mensajes (p. ej. un validador nuevo), edita el mapeo en `error-input.component.ts` — es el único lugar.

> **Ámbito (importante):** `app-error-input` se usa **solo en formularios que persisten datos** (Agregar/Editar). Los **filtros de búsqueda se mantienen permisivos**: sin validadores por campo y sin mensajes de error inline. La única regla de filtros —"al menos un filtro"— se resuelve con un toast (`MessageService`) en el método que aplica la búsqueda, no por campo.

### 3.3 Uso de condicionales

_Obligatorio:_ Para la creación de nuevos módulos, en caso de querer condicionar el reanderizado de un componente, se deberá usar la notación `@if / @else if / @else`. Esto es por la versión de Angular 21.

```html
<!-- Para mostrar modales. (<p-dialog>) -->
@if(mostrarModal){
<p-dialog>
  <p>Estructura dentro del modal.</p>
</p-dialog>
}

<!-- Para mostrar algún elemento en específico -->
@if (condicion) {
<p>Texto a mostrar si se cumple condición</p>
} @else if (otraCondicion) {
<p>Texto a mostrar si se cumple otra condición</p>
} @else {
<p>Texto a mostrar si ninguna condición es verdadera</p>
}
```

Para el randerizado cíclico, se deberá usar la notación `@for`. Esto es por la versión de Angular 20. Es importante agregar el `track` para optimizar el rendimiento que deberá ser un identificador único de cada elemento. En caso de que no existe, se deberá usar el elemento como índice.

```html
@for (item of items; track item.id) {
<!-- Código a renderizar por cada elemento -->
<p>Elemento con id {{ item.id }} y nombre {{ item.nombre }}</p>
}
```

---

## 4. Clasificación y Estilos de Botones de Acción

El proyecto utiliza semántica de colores a través de las clases de PrimeNG.

### 4.1 Botones de Acción Positiva (Primarios)

Acciones como: **Crear, Agregar, Guardar, Enviar, Buscar**.

- **Apariencia:** Fondo oscuro/primario.
- **Implementación:** Omitir `styleClass` (PrimeNG aplica primario por defecto), o forzar si es necesario.

```html
<!-- Buscar -->
<p-button
  type="submit"
  icon="pi pi-search"
  iconPos="left"
  label="Buscar"
></p-button>

<!-- Guardar -->
<p-button type="button" icon="pi pi-save" label="Guardar"></p-button>
```

### 4.2 Botones de Acción Negativa o Secundaria

Acciones como: **Limpiar, Cancelar, Regresar, Cerrar, Eliminar**.

- **Apariencia:** Fondo gris o invertido.
- **Implementación:** Obligatorio el uso de `styleClass="p-button-secondary"`.

```html
<!-- Limpiar (Goma de borrar cruzada) -->
<p-button
  type="button"
  styleClass="p-button-secondary"
  icon="pi pi-eraser"
  iconPos="left"
  label="Limpiar"
  (onClick)="limpiarFiltros()"
>
</p-button>

<!-- Cancelar -->
<p-button
  type="button"
  styleClass="p-button-secondary"
  icon="pi pi-times"
  label="Cancelar"
>
</p-button>
```

### 4.3 Botones de Acción Intermedia o de UI (`outlined`)

Acciones que **no persisten ni ejecutan lógica de negocio**, solo cambian la vista, exportan o informan: **Mostrar/Ocultar filtros, Exportar Excel, botón de Información**.

- **Apariencia:** contorno sin relleno.
- **Implementación:** propiedad `outlined` (sin `styleClass`).

```html
<!-- Mostrar/Ocultar filtros -->
<p-button
  type="button"
  icon="pi pi-filter"
  label="Mostrar filtros"
  outlined
  (onClick)="toggleFiltros()"
></p-button>

<!-- Exportar Excel -->
<p-button
  type="button"
  icon="pi pi-file-excel"
  label="Exportar Excel"
  pTooltip="Exportar a Excel"
  tooltipPosition="top"
  outlined
  (onClick)="exportExcel()"
></p-button>

<!-- Información (ícono redondo) -->
<p-button icon="pi pi-info" rounded outlined pTooltip="Información" tooltipPosition="top" (onClick)="showModalInfo()" />
```

> **Criterio rápido:** ¿la acción persiste/ejecuta lógica (guardar, eliminar, buscar, ejecutar)? → primaria (§4.1) o secundaria (§4.2). ¿Solo cambia la vista, exporta o informa? → `outlined` (§4.3). Los botones **dentro de la tabla** (por fila) son el caso aparte de §5.2.

---

## 5. Plantilla Estándar para Tablas (`<p-table>`)

Las tablas son el componente más complejo. Deben seguir esta configuración siempre a menos que se indique lo contrario.

### 5.1 Propiedades de `<p-table>` requeridas

```html
<div class="mt-5">
  <p-table
    #tabla
    [value]="listaDatos()"
    dataKey="id"
    styleClass="p-datatable-striped"
    [tableStyle]="{ 'min-width': '50rem' }"
    [scrollable]="true"
    scrollHeight="60dvh"
    [paginator]="true"
    [rows]="10"
    [rowsPerPageOptions]="[10, 20, 50]"
    [showCurrentPageReport]="true"
    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
    [totalRecords]="totalRecords()"
    [loading]="cargando()"
  >
    <!-- Carga diferida (server-side) opcional: [lazy]="true" (onLazyLoad)="onConsulta($event)" -->

    <!-- HEADER -->
    <ng-template pTemplate="header">
      <tr>
        <!-- 1ª columna SIEMPRE congelada -->
        <th pSortableColumn="nombreCampo" pFrozenColumn alignFrozen="left">
          Etiqueta Columna <p-sortIcon field="nombreCampo"></p-sortIcon>
        </th>
        <!-- Importes/cantidades: alineados a la derecha -->
        <th style="text-align: right;" pSortableColumn="importe">
          Importe <p-sortIcon field="importe"></p-sortIcon>
        </th>
        <!-- La columna de acciones NO es ordenable -->
        <th style="text-align: center;">Acciones</th>
      </tr>
    </ng-template>

    <!-- BODY -->
    <ng-template pTemplate="body" let-item>
      <tr>
        <!-- 1ª columna: min-width 200px y congelada -->
        <td style="min-width: 200px;" pFrozenColumn alignFrozen="left">{{ item.nombreCampo }}</td>
        <!-- Importe: min-width 200px y a la derecha -->
        <td style="min-width: 200px; text-align: right;">{{ item.importe | currency:'MXN':'symbol':'1.2-2' }}</td>
        <!-- Acciones: min-width 100px, contenido centrado -->
        <td style="min-width: 100px;">
          <div class="flex items-center justify-center gap-2">
            <!-- Toggle de estatus (opcional) -->
            <p-toggleswitch
              [(ngModel)]="item.activo"
              (onChange)="cambiarEstado($event, item)"
            ></p-toggleswitch>

            <!-- Botones de acción: SIEMPRE rounded + text + primary, con tooltipPosition="top" -->
            <button
              pButton
              pRipple
              type="button"
              icon="pi pi-pencil"
              pTooltip="Editar registro"
              tooltipPosition="top"
              class="p-button-rounded p-button-text p-button-primary"
              (click)="editarRegistro(item)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>

    <!-- EMPTY STATE -->
    <ng-template pTemplate="emptymessage">
      <tr>
        <td colspan="3" class="text-center py-4">
          No existen registros para mostrar.
        </td>
      </tr>
    </ng-template>
  </p-table>
</div>
```

### 5.2 Reglas obligatorias de la tabla

- **`[scrollable]="true"` + `scrollHeight="60dvh"`**: acota el alto y mantiene el **caption y el header fijos (sticky)** durante el scroll.
- **Primera columna congelada**: `pFrozenColumn alignFrozen="left"` en su `<th>` y `<td>` (si la tabla usa checks, la congelada es la del checkbox), para no perder referencia al hacer scroll horizontal.
- **`min-width` de celdas**: `200px` por defecto; **`100px`** en la columna de Acciones.
- **Alineación de `<td>`**: izquierda por defecto (no se declara); **importes/cantidades a la derecha** (`text-align: right`); **Acciones al centro** (`text-align: center`).
- **Columna Acciones**: la cabecera NO lleva `pSortableColumn`; los botones van dentro de `<div class="flex items-center justify-center gap-2">`.
- **Botones de acción**: SIEMPRE `class="p-button-rounded p-button-text p-button-primary"`, con `pTooltip="Descripción"` (obligatorio) y **`tooltipPosition="top"`**. (`p-button-primary` = color de marca; **no** usar `p-button-info`, que es otro color.)

---

## 6. Uso de Modales (`<p-dialog>`)

Los cuadros de diálogo (alta/edición reactiva u observadora) deben aislarse en `<p-dialog>` con las siguientes propiedades para evitar que rompan pantallas en móvil o salgan de su contenedor.

```html
<p-dialog
  [(visible)]="modalVisible"
  [modal]="true"
  [showHeader]="false"
  [breakpoints]="{ '960px': '90vw' }"
  [style]="{ width: '70vw', minHeight: '400px' }"
  [draggable]="false"
  [resizable]="false"
>
  <!-- Header customizado -->
  <div class="flex items-center justify-between my-5">
    <h2 class="modal-title">Título del Formulario</h2>
  </div>

  <!-- Contenido (formulario, inputs, etc) -->
  <form ...>...</form>
</p-dialog>
```

> **Nota:** La clase `.modal-title` se utiliza estandarizada en el proyecto para los h2 de los diálogos.

---

## 7. Comentado Obligatorio (Clean HTML)

Para evitar bloques HTML gigantes y crípticos, la IA debe generar comentarios de alto nivel dividiendo estructuralmente cada sección de la plantilla:

```html
<!-- ============================================== -->
<!-- 1. Encabezado y Acción Principal                 -->
<!-- ============================================== -->
<div class="flex ...">...</div>

<!-- ============================================== -->
<!-- 2. Formulario de Filtros de Búsqueda           -->
<!-- ============================================== -->
<form [formGroup]="..." ...>...</form>

<!-- ============================================== -->
<!-- 3. Resultados: Tabla de UI                     -->
<!-- ============================================== -->
<div class="mt-5">
  <p-table ...> ... </p-table>
</div>

<!-- ============================================== -->
<!-- 4. Modales y Overlays                          -->
<!-- ============================================== -->
<p-dialog ...> ... </p-dialog>
```

---

## 8. Referencia de componentes PrimeNG

Para referencia de los componentes de PrimeNG y sus propiedades, ver los componentes de la carpeta [uiKit](/src/app/pages/uikit).

> **Nota:** Los componentes HTML se alojan en `src/app/features/[modulo]/pages/` (Smart) o `src/app/features/[modulo]/components/` (Dumb) según la nueva arquitectura feature-based. Consulta `../reordenacion_arquitectonica/estructura_features.md` para más detalles.

---


## 9. Checklist de Validación antes de entregar

- [ ] ¿Los botones genéricos (Guardar/Buscar) no tienen `.p-button-secondary`? (Reglas de botones primarios)
- [ ] ¿Los botones destructivos/cancelación llevan explícitamente `styleClass="p-button-secondary"`?
- [ ] ¿Los botones de acción intermedia/UI (mostrar filtros, exportar, info) usan `outlined`? (§4.3)
- [ ] ¿Los botones de icono en tablas usan `pTooltip` obligatorio?
- [ ] ¿Los dropdowns usan `[showClear]="true"` y `appendTo="body"`?
- [ ] ¿Los inputs/campos están envueltos en su propio div con la clase `col input-container`?
- [ ] ¿El campo nombre usa `appMayusculas` y el campo correo usa `appMinusculas`? (Regla de negocio de capitalización)
- [ ] ¿Cada campo con validación usa `<app-error-input [control]="...">` en lugar de un `<small>` escrito a mano? (§3.2.2)
- [ ] ¿El layout usa **solo** clases de Tailwind? (cero PrimeFlex/Bootstrap: nada de `align-items-*`, `justify-content-*`, `flex-column`, `col-N`, `surface-N`, `border-circle`, etc. — ver tabla §2)
- [ ] ¿La tabla implementa `[paginator]="true"` y su bloque `emptymessage`?
- [ ] ¿La tabla usa `[scrollable]="true"` + `scrollHeight="60dvh"`, 1ª columna `pFrozenColumn alignFrozen="left"`, `min-width` 200/100px, importes a la derecha y Acciones al centro? (§5.2)
- [ ] ¿Los botones de acción usan `p-button-rounded p-button-text p-button-primary` (no `-info`) y `tooltipPosition="top"`?
- [ ] ¿El HTML está seccionado con los comentarios estándar (`<!-- == 1. Encabezado == -->`)?

---

## 10. Referencias Cruzadas

- Para ver cómo enlazar los observables del componente y `FormGroups` asociados a esta vista, ver [Generacion Componentes TS](../generacion-componentes-ts/SKILL.md)
