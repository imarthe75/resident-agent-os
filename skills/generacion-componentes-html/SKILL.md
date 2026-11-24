---
name: generacion-componentes-html
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

**Antes de generar, lee [`references/filtros-y-formularios.md`](references/filtros-y-formularios.md)** (plantillas completas). Las reglas de esta skill siguen aplicando.

## 4. Clasificación y Estilos de Botones de Acción

**Antes de generar, lee [`references/botones-de-accion.md`](references/botones-de-accion.md)** (plantillas completas). Las reglas de esta skill siguen aplicando.

## 5. Plantilla Estándar para Tablas (`<p-table>`)

**Antes de generar, lee [`references/tablas.md`](references/tablas.md)** (plantillas completas). Las reglas de esta skill siguen aplicando.

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

> **Nota:** Los componentes HTML se alojan en `src/app/features/[modulo]/pages/` (Smart) o `src/app/features/[modulo]/components/` (Dumb) según la nueva arquitectura feature-based. Consulta `../frontend-reordenacion-arquitectonica/estructura_features.md` para más detalles.

---


## 8b. Accesibilidad y seguridad (obligatorio, WCAG 2.1 AA)
- **Etiqueta asociada en todo control:** `<label for="id">` con el mismo `id` en el control (o `inputId` en componentes PrimeNG como
  `p-select`, `p-datepicker`, `p-inputnumber`). Con `formControlName`, el `id`/`inputId` sigue siendo obligatorio. Un `placeholder` no es etiqueta.
- **Nombre accesible en botones de icono:** `[ariaLabel]`/`aria-label` además del `pTooltip` (el tooltip no lo lee un lector de pantalla).
- **Imágenes:** `alt` descriptivo; decorativas `alt=""`. **Iframes** con `title`.
- **`autocomplete`** en campos de datos personales (`name`, `email`, `tel`, `street-address`); `autocomplete="off"` solo en datos que no deben recordarse.
- **Foco visible:** no quitar el contorno de foco (`outline: none`) sin un sustituto visible. Sin `tabindex` positivo.
- **Ids únicos** en la página: cuidado con plantillas repetidas (`@for`) — usar un sufijo con el índice o el id del registro.
- **Elementos clicables:** usar `<button>`/`<p-button>`, no `<div (click)>`; si es inevitable, `role="button"`, `tabindex="0"` y manejo de teclado.
- **Contenido dinámico:** interpolación `{{ }}` (Angular escapa). `[innerHTML]` solo con contenido propio y sanitizado por Angular;
  nunca `bypassSecurityTrust*` con datos del usuario o del servidor (única excepción aceptada: `blob:` creado con `URL.createObjectURL` para
  previsualizar un archivo propio).
- **Enlaces externos** con `target="_blank"` llevan `rel="noopener noreferrer"`.

Identificadores de regla en escáneres que los detectan: `WCAG-1.3.1-FORM-CONTROL-NO-LABEL`, `ACCESSIBILITY-WCAG-MISSING-LABEL`, `WCAG-4.1.1-DUPLICATE-ID`,
`WCAG-1.3.5-INPUT-NO-AUTOCOMPLETE`, `ANGULAR-BYPASS-SECURITY-TRUST`.

## 9. Checklist de Validación antes de entregar

- [ ] ¿Los botones genéricos (Guardar/Buscar) no tienen `.p-button-secondary`? (Reglas de botones primarios)
- [ ] ¿Los botones destructivos/cancelación llevan explícitamente `styleClass="p-button-secondary"`?
- [ ] ¿Los botones de acción intermedia/UI (mostrar filtros, exportar, info) usan `outlined`? (`references/botones-de-accion.md` §4.3)
- [ ] ¿Los botones de icono en tablas usan `pTooltip` obligatorio?
- [ ] ¿Los dropdowns usan `[showClear]="true"` y `appendTo="body"`?
- [ ] ¿Los inputs/campos están envueltos en su propio div con la clase `col input-container`?
- [ ] ¿El campo nombre usa `appMayusculas` y el campo correo usa `appMinusculas`? (Regla de negocio de capitalización)
- [ ] ¿Cada campo con validación usa `<app-error-input [control]="...">` en lugar de un `<small>` escrito a mano? (`references/filtros-y-formularios.md` §3.2.2)
- [ ] ¿El layout usa **solo** clases de Tailwind? (cero PrimeFlex/Bootstrap: nada de `align-items-*`, `justify-content-*`, `flex-column`, `col-N`, `surface-N`, `border-circle`, etc. — ver tabla §2)
- [ ] ¿La tabla implementa `[paginator]="true"` y su bloque `emptymessage`?
- [ ] ¿La tabla usa `[scrollable]="true"` + `scrollHeight="60dvh"`, 1ª columna `pFrozenColumn alignFrozen="left"`, `min-width` 200/100px, importes a la derecha y Acciones al centro? (`references/tablas.md` §5.2)
- [ ] ¿Los botones de acción usan `p-button-rounded p-button-text p-button-primary` (no `-info`) y `tooltipPosition="top"`?
- [ ] ¿El HTML está seccionado con los comentarios estándar (`<!-- == 1. Encabezado == -->`)?

---

## 10. Referencias Cruzadas

- Para ver cómo enlazar los observables del componente y `FormGroups` asociados a esta vista, ver [Generacion Componentes TS](../generacion-componentes-ts/SKILL.md)

## Reglas del escáner que esta skill evita
`WCAG-1.3.1-FORM-CONTROL-NO-LABEL`, `ACCESSIBILITY-WCAG-MISSING-LABEL`, `WCAG-4.1.1-DUPLICATE-ID`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
