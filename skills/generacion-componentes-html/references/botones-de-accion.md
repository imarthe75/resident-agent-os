# 4. Clasificación y Estilos de Botones de Acción

> Detalle de la skill `generacion-componentes-html` (se lee al generar; las reglas están en su SKILL.md).

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
