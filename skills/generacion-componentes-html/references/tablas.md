# 5. Plantilla Estándar para Tablas (`<p-table>`)

> Detalle de la skill `generacion-componentes-html` (se lee al generar; las reglas están en su SKILL.md).

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
- **Carga inicial**: con `[lazy]="true"` la primera carga la hace `(onLazyLoad)`; el componente no busca también en `ngOnInit()`.
- **Paginador**: `paginatorDropdownAppendTo="body"`, `[rowsPerPageOptions]="[10, 20, 50]"` y
  `currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"`.
- **Acciones estándar por fila** (cada una con `*appIfPermiso`): cambiar estatus (`<p-toggleswitch>`, `_ACTIVAR`), consultar (`pi-eye`,
  `_CONSULTAR`, diálogo de solo lectura sin asteriscos ni botón Guardar), editar (`pi-pencil`, `_EDITAR`), eliminar (`pi-trash`, `_ELIMINAR`,
  con confirmación). Restablecer no es botón de la fila: se ofrece ante el 409 de registro borrado (`generacion-componentes-ts` §6).
- **Botones de acción**: SIEMPRE `class="p-button-rounded p-button-text p-button-primary"`, con `pTooltip="Descripción"` (obligatorio) y **`tooltipPosition="top"`**. (`p-button-primary` = color de marca; **no** usar `p-button-info`, que es otro color.)

---
