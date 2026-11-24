# 3. Estructura de Filtros de Búsqueda y Formularios

> Detalle de la skill `generacion-componentes-html` (se lee al generar; las reglas están en su SKILL.md).

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
