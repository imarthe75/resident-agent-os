import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import {
    CatalogoService,
    CatalogoResponse,
    CrearCatalogoRequest,
    ActualizarCatalogoRequest,
    ItemCatalogoResponse,
    CrearItemCatalogoRequest,
    ActualizarItemCatalogoRequest
} from '@/app/pages/service/catalogo.service';

@Component({
    selector: 'app-catalogos',
    standalone: true,
    imports: [
        FormsModule,
        TableModule,
        ToolbarModule,
        ButtonModule,
        ToastModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CheckboxModule,
        TooltipModule,
        ToggleButtonModule,
        DatePipe,
        NgClass
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />

        <!-- ===== TABLA DE CATÁLOGOS ===== -->
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo catálogo" icon="pi pi-plus" severity="secondary" (onClick)="abrirNuevoCatalogo()" />
            </ng-template>
            <ng-template #end>
                <p-togglebutton
                    [(ngModel)]="mostrarInactivosCatalogos"
                    onLabel="Mostrando inactivos"
                    offLabel="Solo activos"
                    onIcon="pi pi-eye"
                    offIcon="pi pi-eye-slash"
                    (onChange)="cargarCatalogos()"
                />
            </ng-template>
        </p-toolbar>

        <p-table
            #dtCatalogos
            [value]="catalogos()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombre', 'descripcion']"
            [tableStyle]="{ 'min-width': '40rem' }"
            [rowHover]="true"
            dataKey="id"
            selectionMode="single"
            [(selection)]="catalogoSeleccionado"
            (onRowSelect)="onSeleccionarCatalogo($any($event.data))"
            (onRowUnselect)="onDeseleccionarCatalogo()"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} catálogos"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [loading]="cargandoCatalogos()"
            [stripedRows]="true"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Catálogos maestros</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="filtroGlobal(dtCatalogos, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th pSortableColumn="nombre" style="min-width: 14rem">
                        Nombre <p-sortIcon field="nombre" />
                    </th>
                    <th pSortableColumn="descripcion" style="min-width: 18rem">
                        Descripción <p-sortIcon field="descripcion" />
                    </th>
                    <th pSortableColumn="activo" style="min-width: 8rem">
                        Estatus <p-sortIcon field="activo" />
                    </th>
                    <th pSortableColumn="fechaCreacion" style="min-width: 12rem">
                        Fecha de creación <p-sortIcon field="fechaCreacion" />
                    </th>
                    <th style="min-width: 10rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-catalogo>
                <tr [pSelectableRow]="catalogo" [ngClass]="{ 'opacity-50': !catalogo.activo }">
                    <td class="font-semibold">{{ catalogo.nombre }}</td>
                    <td>{{ catalogo.descripcion }}</td>
                    <td>
                        <p-tag [value]="catalogo.activo ? 'Activo' : 'Inactivo'" [severity]="catalogo.activo ? 'success' : 'danger'" />
                    </td>
                    <td>{{ catalogo.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                        @if (catalogo.activo) {
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="abrirEditarCatalogo(catalogo)" />
                            <p-button icon="pi pi-ban" severity="danger" [rounded]="true" [outlined]="true" pTooltip="Inactivar" tooltipPosition="top" (click)="confirmarEliminarCatalogo(catalogo)" />
                        } @else {
                            <p-button icon="pi pi-refresh" severity="success" [rounded]="true" [outlined]="true" pTooltip="Reactivar" tooltipPosition="top" (click)="reactivarCatalogo(catalogo)" />
                        }
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="5" class="text-center p-6">No hay catálogos registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ===== TABLA DE ITEMS (visible al seleccionar un catálogo) ===== -->
        @if (catalogoSeleccionado) {
            <div class="mt-8">
                <p-toolbar styleClass="mb-4">
                    <ng-template #start>
                        <div class="flex items-center gap-3">
                            <p-button icon="pi pi-arrow-left" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="onDeseleccionarCatalogo()" />
                            <span class="font-semibold text-lg">Ítems de: <span class="text-primary">{{ catalogoSeleccionado.nombre }}</span></span>
                        </div>
                    </ng-template>
                    <ng-template #end>
                        <div class="flex items-center gap-3">
                            <p-togglebutton
                                [(ngModel)]="mostrarInactivosItems"
                                onLabel="Mostrando inactivos"
                                offLabel="Solo activos"
                                onIcon="pi pi-eye"
                                offIcon="pi pi-eye-slash"
                                (onChange)="cargarItems(catalogoSeleccionado!.id)"
                            />
                            <p-button label="Nuevo ítem" icon="pi pi-plus" severity="secondary" (onClick)="abrirNuevoItem()" />
                        </div>
                    </ng-template>
                </p-toolbar>

                <p-table
                    #dtItems
                    [value]="items()"
                    [rows]="10"
                    [paginator]="true"
                    [globalFilterFields]="['valor']"
                    [tableStyle]="{ 'min-width': '30rem' }"
                    [rowHover]="true"
                    dataKey="id"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ítems"
                    [showCurrentPageReport]="true"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [loading]="cargandoItems()"
                    [stripedRows]="true"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between">
                            <h5 class="m-0">Ítems del catálogo</h5>
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="filtroGlobal(dtItems, $event)" placeholder="Buscar..." />
                            </p-iconfield>
                        </div>
                    </ng-template>

                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="valor" style="min-width: 16rem">
                                Valor <p-sortIcon field="valor" />
                            </th>
                            <th pSortableColumn="activo" style="min-width: 8rem">
                                Estatus <p-sortIcon field="activo" />
                            </th>
                            <th pSortableColumn="fechaCreacion" style="min-width: 12rem">
                                Fecha de creación <p-sortIcon field="fechaCreacion" />
                            </th>
                            <th style="min-width: 10rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-item>
                        <tr [ngClass]="{ 'opacity-50': !item.activo }">
                            <td class="font-medium">{{ item.valor }}</td>
                            <td>
                                <p-tag [value]="item.activo ? 'Activo' : 'Inactivo'" [severity]="item.activo ? 'success' : 'danger'" />
                            </td>
                            <td>{{ item.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                @if (item.activo) {
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="abrirEditarItem(item)" />
                                    <p-button icon="pi pi-ban" severity="danger" [rounded]="true" [outlined]="true" pTooltip="Inactivar" tooltipPosition="top" (click)="confirmarEliminarItem(item)" />
                                } @else {
                                    <p-button icon="pi pi-refresh" severity="success" [rounded]="true" [outlined]="true" pTooltip="Reactivar" tooltipPosition="top" (click)="reactivarItem(item)" />
                                }
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="4" class="text-center p-6">No hay ítems para este catálogo.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        }

        <!-- ===== DIÁLOGO CATÁLOGO ===== -->
        <p-dialog
            [(visible)]="mostrarDialogCatalogo"
            [style]="{ width: '480px' }"
            [header]="esNuevoCatalogo ? 'Nuevo catálogo' : 'Editar catálogo'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="catNombre" class="block font-bold mb-2">Nombre <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="catNombre" [(ngModel)]="formCatalogo.nombre" autofocus fluid />
                        @if (enviadoCatalogo && !formCatalogo.nombre.trim()) {
                            <small class="text-red-500">El nombre es obligatorio.</small>
                        }
                    </div>
                    <div>
                        <label for="catDescripcion" class="block font-bold mb-2">Descripción</label>
                        <textarea pTextarea id="catDescripcion" [(ngModel)]="formCatalogo.descripcion" rows="3" fluid></textarea>
                    </div>
                    @if (!esNuevoCatalogo) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="formCatalogo.activo" [binary]="true" inputId="catActivo" />
                            <label for="catActivo">Activo</label>
                        </div>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="cerrarDialogCatalogo()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardandoCatalogo()" (click)="guardarCatalogo()" />
            </ng-template>
        </p-dialog>

        <!-- ===== DIÁLOGO ÍTEM ===== -->
        <p-dialog
            [(visible)]="mostrarDialogItem"
            [style]="{ width: '420px' }"
            [header]="esNuevoItem ? 'Nuevo ítem' : 'Editar ítem'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="itemValor" class="block font-bold mb-2">Valor <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="itemValor" [(ngModel)]="formItem.valor" autofocus fluid />
                        @if (enviadoItem && !formItem.valor.trim()) {
                            <small class="text-red-500">El valor es obligatorio.</small>
                        }
                    </div>
                    @if (!esNuevoItem) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="formItem.activo" [binary]="true" inputId="itemActivo" />
                            <label for="itemActivo">Activo</label>
                        </div>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="cerrarDialogItem()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardandoItem()" (click)="guardarItem()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class CatalogosComponent implements OnInit {
    private readonly catalogoService = inject(CatalogoService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    @ViewChild('dtCatalogos') dtCatalogos!: Table;
    @ViewChild('dtItems') dtItems!: Table;

    // --- Catálogos ---
    catalogos = signal<CatalogoResponse[]>([]);
    cargandoCatalogos = signal(false);
    guardandoCatalogo = signal(false);
    catalogoSeleccionado: CatalogoResponse | null = null;
    mostrarInactivosCatalogos = false;

    mostrarDialogCatalogo = false;
    esNuevoCatalogo = true;
    enviadoCatalogo = false;
    catalogoEnEdicion: CatalogoResponse | null = null;

    formCatalogo: { nombre: string; descripcion: string; activo: boolean } = this.formCatalogoVacio();

    // --- Items ---
    items = signal<ItemCatalogoResponse[]>([]);
    cargandoItems = signal(false);
    guardandoItem = signal(false);
    mostrarInactivosItems = false;

    mostrarDialogItem = false;
    esNuevoItem = true;
    enviadoItem = false;
    itemEnEdicion: ItemCatalogoResponse | null = null;

    formItem: { valor: string; activo: boolean } = this.formItemVacio();

    ngOnInit() {
        this.cargarCatalogos();
    }

    // ========== Catálogos ==========

    cargarCatalogos() {
        this.cargandoCatalogos.set(true);
        this.catalogoService.listar(this.mostrarInactivosCatalogos).subscribe({
            next: (data) => {
                this.catalogos.set(data);
                this.cargandoCatalogos.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de catálogos.' });
                this.cargandoCatalogos.set(false);
            }
        });
    }

    abrirNuevoCatalogo() {
        this.esNuevoCatalogo = true;
        this.catalogoEnEdicion = null;
        this.formCatalogo = this.formCatalogoVacio();
        this.enviadoCatalogo = false;
        this.mostrarDialogCatalogo = true;
    }

    abrirEditarCatalogo(catalogo: CatalogoResponse) {
        this.esNuevoCatalogo = false;
        this.catalogoEnEdicion = catalogo;
        this.formCatalogo = {
            nombre: catalogo.nombre ?? '',
            descripcion: catalogo.descripcion ?? '',
            activo: catalogo.activo
        };
        this.enviadoCatalogo = false;
        this.mostrarDialogCatalogo = true;
    }

    guardarCatalogo() {
        this.enviadoCatalogo = true;
        if (!this.formCatalogo.nombre?.trim()) return;

        if (this.esNuevoCatalogo) {
            const request: CrearCatalogoRequest = {
                nombre: this.formCatalogo.nombre.trim(),
                descripcion: this.formCatalogo.descripcion || undefined
            };
            this.guardandoCatalogo.set(true);
            this.catalogoService.crear(request).subscribe({
                next: (nuevo) => {
                    this.catalogos.update((lista) => [...lista, nuevo]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Catálogo creado correctamente.' });
                    this.cerrarDialogCatalogo();
                    this.guardandoCatalogo.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el catálogo.' });
                    this.guardandoCatalogo.set(false);
                }
            });
        } else {
            const request: ActualizarCatalogoRequest = {
                nombre: this.formCatalogo.nombre.trim() || undefined,
                descripcion: this.formCatalogo.descripcion || undefined,
                activo: this.formCatalogo.activo
            };
            this.guardandoCatalogo.set(true);
            this.catalogoService.actualizar(this.catalogoEnEdicion!.id, request).subscribe({
                next: (actualizado) => {
                    this.catalogos.update((lista) => lista.map((c) => (c.id === actualizado.id ? actualizado : c)));
                    if (this.catalogoSeleccionado?.id === actualizado.id) {
                        this.catalogoSeleccionado = actualizado;
                    }
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Catálogo actualizado correctamente.' });
                    this.cerrarDialogCatalogo();
                    this.guardandoCatalogo.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el catálogo.' });
                    this.guardandoCatalogo.set(false);
                }
            });
        }
    }

    confirmarEliminarCatalogo(catalogo: CatalogoResponse) {
        this.confirmationService.confirm({
            message: `¿Desea inactivar el catálogo <strong>${catalogo.nombre}</strong>?`,
            header: 'Confirmar inactivación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, inactivar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.catalogoService.eliminar(catalogo.id).subscribe({
                    next: () => {
                        this.catalogos.update((lista) => lista.map((c) => (c.id === catalogo.id ? { ...c, activo: false } : c)));
                        if (this.catalogoSeleccionado?.id === catalogo.id) {
                            this.catalogoSeleccionado = { ...catalogo, activo: false };
                        }
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Catálogo inactivado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inactivar el catálogo.' });
                    }
                });
            }
        });
    }

    reactivarCatalogo(catalogo: CatalogoResponse) {
        this.catalogoService.actualizar(catalogo.id, { activo: true }).subscribe({
            next: (actualizado) => {
                this.catalogos.update((lista) => lista.map((c) => (c.id === actualizado.id ? actualizado : c)));
                if (this.catalogoSeleccionado?.id === actualizado.id) {
                    this.catalogoSeleccionado = actualizado;
                }
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Catálogo reactivado correctamente.' });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar el catálogo.' });
            }
        });
    }

    cerrarDialogCatalogo() {
        this.mostrarDialogCatalogo = false;
        this.formCatalogo = this.formCatalogoVacio();
        this.enviadoCatalogo = false;
    }

    // ========== Selección de catálogo ==========

    onSeleccionarCatalogo(catalogo: CatalogoResponse) {
        this.catalogoSeleccionado = catalogo;
        this.cargarItems(catalogo.id);
    }

    onDeseleccionarCatalogo() {
        this.catalogoSeleccionado = null;
        this.items.set([]);
    }

    // ========== Items ==========

    cargarItems(catalogoId: number) {
        this.cargandoItems.set(true);
        this.catalogoService.listarItems(catalogoId, this.mostrarInactivosItems).subscribe({
            next: (data) => {
                this.items.set(data);
                this.cargandoItems.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los ítems del catálogo.' });
                this.cargandoItems.set(false);
            }
        });
    }

    abrirNuevoItem() {
        this.esNuevoItem = true;
        this.itemEnEdicion = null;
        this.formItem = this.formItemVacio();
        this.enviadoItem = false;
        this.mostrarDialogItem = true;
    }

    abrirEditarItem(item: ItemCatalogoResponse) {
        this.esNuevoItem = false;
        this.itemEnEdicion = item;
        this.formItem = {
            valor: item.valor ?? '',
            activo: item.activo
        };
        this.enviadoItem = false;
        this.mostrarDialogItem = true;
    }

    guardarItem() {
        this.enviadoItem = true;
        if (!this.formItem.valor?.trim()) return;

        if (this.esNuevoItem) {
            const request: CrearItemCatalogoRequest = {
                valor: this.formItem.valor.trim()
            };
            this.guardandoItem.set(true);
            this.catalogoService.crearItem(this.catalogoSeleccionado!.id, request).subscribe({
                next: (nuevo) => {
                    this.items.update((lista) => [...lista, nuevo]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ítem creado correctamente.' });
                    this.cerrarDialogItem();
                    this.guardandoItem.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ítem.' });
                    this.guardandoItem.set(false);
                }
            });
        } else {
            const request: ActualizarItemCatalogoRequest = {
                valor: this.formItem.valor.trim() || undefined,
                activo: this.formItem.activo
            };
            this.guardandoItem.set(true);
            this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, this.itemEnEdicion!.id, request).subscribe({
                next: (actualizado) => {
                    this.items.update((lista) => lista.map((i) => (i.id === actualizado.id ? actualizado : i)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ítem actualizado correctamente.' });
                    this.cerrarDialogItem();
                    this.guardandoItem.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el ítem.' });
                    this.guardandoItem.set(false);
                }
            });
        }
    }

    confirmarEliminarItem(item: ItemCatalogoResponse) {
        this.confirmationService.confirm({
            message: `¿Desea inactivar el ítem <strong>${item.valor}</strong>?`,
            header: 'Confirmar inactivación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, inactivar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.catalogoService.eliminarItem(this.catalogoSeleccionado!.id, item.id).subscribe({
                    next: () => {
                        this.items.update((lista) => lista.map((i) => (i.id === item.id ? { ...i, activo: false } : i)));
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ítem inactivado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inactivar el ítem.' });
                    }
                });
            }
        });
    }

    reactivarItem(item: ItemCatalogoResponse) {
        this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, item.id, { activo: true }).subscribe({
            next: (actualizado) => {
                this.items.update((lista) => lista.map((i) => (i.id === actualizado.id ? actualizado : i)));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ítem reactivado correctamente.' });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar el ítem.' });
            }
        });
    }

    cerrarDialogItem() {
        this.mostrarDialogItem = false;
        this.formItem = this.formItemVacio();
        this.enviadoItem = false;
    }

    filtroGlobal(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private formCatalogoVacio() {
        return { nombre: '', descripcion: '', activo: true };
    }

    private formItemVacio() {
        return { valor: '', activo: true };
    }
}
