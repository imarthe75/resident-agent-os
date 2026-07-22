import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ActualizarMenuRequest, CrearMenuRequest, MenuResponse, MenuService } from '@/app/pages/service/menu.service';

interface IconoMenuOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-menus',
    standalone: true,
    imports: [
        FormsModule,
        TableModule,
        ToolbarModule,
        ButtonModule,
        ToastModule,
        InputTextModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CheckboxModule,
        SelectModule,
        InputNumberModule
    ],
    providers: [MessageService, ConfirmationService],
    styles: [
        `
            :host ::ng-deep .catalogo-iconos-dialog .p-dialog-content {
                max-height: min(68vh, 42rem);
                overflow: auto;
            }

            .iconos-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
                gap: 0.75rem;
            }

            .icono-card {
                border: 1px solid var(--p-content-border-color);
                border-radius: 0.75rem;
                padding: 0.75rem;
                background: var(--p-content-background);
                transition: border-color 0.2s ease, transform 0.2s ease;
                cursor: pointer;
                width: 100%;
                text-align: left;
            }

            .icono-card:hover {
                border-color: var(--p-primary-color);
                transform: translateY(-1px);
            }

            .icono-card--active {
                border-color: var(--p-primary-color);
                box-shadow: 0 0 0 1px var(--p-primary-color);
            }

            .icono-card__titulo,
            .icono-card__valor {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .icono-card__valor {
                color: var(--p-text-muted-color);
                font-size: 0.8rem;
            }
        `
    ],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo menú" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="menus()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['label', 'route', 'icon', 'peso']"
            [tableStyle]="{ 'min-width': '64rem' }"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} menús"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [loading]="cargando()"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestión de Menús</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="filtroGlobal(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th pSortableColumn="label" style="min-width: 14rem">
                        Etiqueta
                        <p-sortIcon field="label" />
                    </th>
                    <th pSortableColumn="route" style="min-width: 14rem">
                        Ruta
                        <p-sortIcon field="route" />
                    </th>
                    <th pSortableColumn="icon" style="min-width: 10rem">
                        Ícono
                        <p-sortIcon field="icon" />
                    </th>
                    <th pSortableColumn="peso" style="min-width: 8rem">
                        Peso
                        <p-sortIcon field="peso" />
                    </th>
                    <th style="min-width: 14rem">Menú padre</th>
                    <th pSortableColumn="activo" style="min-width: 8rem">
                        Activo
                        <p-sortIcon field="activo" />
                    </th>
                    <th style="min-width: 10rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-menu>
                <tr>
                    <td>{{ menu.label }}</td>
                    <td>{{ menu.route || '-' }}</td>
                    <td>
                        @if (menu.icon) {
                            <div class="flex items-center gap-2">
                                <i [class]="menu.icon"></i>
                                <span>{{ menu.icon }}</span>
                            </div>
                        } @else {
                            <span>-</span>
                        }
                    </td>
                    <td>{{ menu.peso ?? '-' }}</td>
                    <td>{{ obtenerLabelPadre(menu.parentId) }}</td>
                    <td>
                        <p-tag [value]="menu.activo !== false ? 'Activo' : 'Inactivo'" [severity]="menu.activo !== false ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarMenu(menu)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarEliminar(menu)" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="7" class="text-center p-6">No hay menús registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog
            [(visible)]="mostrarDialog"
            [style]="{ width: '540px', 'max-width': '95vw' }"
            [header]="esNuevo ? 'Nuevo Menú' : 'Editar Menú'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="label" class="block font-bold mb-2">Etiqueta <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="label" [(ngModel)]="form.label" required autofocus fluid />
                        @if (enviado && !form.label.trim()) {
                            <small class="text-red-500">La etiqueta es obligatoria.</small>
                        }
                    </div>

                    <div>
                        <label for="route" class="block font-bold mb-2">Ruta</label>
                        <input type="text" pInputText id="route" [(ngModel)]="form.route" placeholder="Ejemplo: /usuarios" fluid />
                    </div>

                    <div>
                        <label for="peso" class="block font-bold mb-2">Peso</label>
                        <p-inputnumber inputId="peso" [(ngModel)]="form.peso" [min]="1" placeholder="Orden de aparición (menor = primero)" fluid />
                    </div>

                    <div>
                        <label for="icon" class="block font-bold mb-2">Ícono</label>
                        <p-select
                            inputId="icon"
                            [options]="opcionesIcono"
                            optionLabel="label"
                            optionValue="value"
                            [filter]="true"
                            filterBy="label,value"
                            [showClear]="true"
                            [placeholder]="'Selecciona un ícono'"
                            [(ngModel)]="form.icon"
                            fluid
                        >
                            <ng-template #selectedItem let-icono>
                                @if (icono) {
                                    <div class="flex items-center gap-2">
                                        <i [class]="icono.value"></i>
                                        <span>{{ icono.label }}</span>
                                        <span class="text-surface-500">({{ icono.value }})</span>
                                    </div>
                                } @else {
                                    <span class="text-surface-500">Selecciona un ícono</span>
                                }
                            </ng-template>
                            <ng-template #item let-icono>
                                <div class="flex items-center justify-between gap-3 w-full">
                                    <div class="flex items-center gap-2">
                                        <i [class]="icono.value"></i>
                                        <span>{{ icono.label }}</span>
                                    </div>
                                    <span class="text-surface-500 text-sm">{{ icono.value }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <div class="mt-3">
                            <p-button label="Ver catálogo de íconos" icon="pi pi-th-large" text severity="secondary" (onClick)="abrirCatalogoIconos()" />
                        </div>
                    </div>

                    <div>
                        <label for="parentId" class="block font-bold mb-2">Menú padre</label>
                        <p-select
                            inputId="parentId"
                            [options]="opcionesPadre()"
                            optionLabel="label"
                            optionValue="value"
                            [showClear]="true"
                            [placeholder]="'Sin menú padre'"
                            [(ngModel)]="form.parentId"
                            fluid
                        />
                    </div>

                    @if (!esNuevo) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="activoMenu" />
                            <label for="activoMenu">Activo</label>
                        </div>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardando()" (onClick)="guardar()" />
            </ng-template>
        </p-dialog>

        <p-dialog
            [(visible)]="mostrarCatalogoIconos"
            [style]="{ width: '920px', 'max-width': '96vw' }"
            [breakpoints]="{ '1100px': '92vw', '768px': '96vw' }"
            styleClass="catalogo-iconos-dialog"
            header="Catálogo de íconos"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="buscarIcono" class="block font-bold mb-2">Buscar ícono</label>
                        <input
                            id="buscarIcono"
                            type="text"
                            pInputText
                            [(ngModel)]="filtroCatalogoIconos"
                            placeholder="Ejemplo: usuario, reporte, pi pi-user"
                            fluid
                        />
                    </div>

                    <div class="text-sm text-surface-500">
                        Mostrando {{ iconosFiltrados().length }} de {{ opcionesIcono.length }} íconos
                    </div>

                    <div class="iconos-grid">
                        @for (icono of iconosFiltrados(); track icono.value) {
                            <button
                                type="button"
                                class="icono-card"
                                [class.icono-card--active]="form.icon === icono.value"
                                (click)="seleccionarIcono(icono.value)"
                            >
                                <div class="flex items-center gap-2 mb-2">
                                    <i [class]="icono.value"></i>
                                    <strong class="icono-card__titulo">{{ icono.label }}</strong>
                                </div>
                                <div class="icono-card__valor">{{ icono.value }}</div>
                            </button>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cerrar" icon="pi pi-times" text (onClick)="cerrarCatalogoIconos()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class MenusComponent implements OnInit {
    private readonly menuService = inject(MenuService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    menus = signal<MenuResponse[]>([]);
    opcionesPadre = signal<SelectItem<number>[]>([]);
    readonly opcionesIcono: IconoMenuOption[] = [
        { label: 'Inicio', value: 'pi pi-home' },
        { label: 'Dashboard', value: 'pi pi-chart-line' },
        { label: 'Usuarios', value: 'pi pi-users' },
        { label: 'Usuario', value: 'pi pi-user' },
        { label: 'Roles', value: 'pi pi-id-card' },
        { label: 'Menús', value: 'pi pi-sitemap' },
        { label: 'Configuración', value: 'pi pi-cog' },
        { label: 'Herramientas', value: 'pi pi-wrench' },
        { label: 'Seguridad', value: 'pi pi-shield' },
        { label: 'Permisos', value: 'pi pi-key' },
        { label: 'Reporte', value: 'pi pi-chart-bar' },
        { label: 'Documento', value: 'pi pi-file' },
        { label: 'Carpeta', value: 'pi pi-folder' },
        { label: 'Calendario', value: 'pi pi-calendar' },
        { label: 'Notificaciones', value: 'pi pi-bell' },
        { label: 'Mensajes', value: 'pi pi-envelope' },
        { label: 'Búsqueda', value: 'pi pi-search' },
        { label: 'Lista', value: 'pi pi-list' },
        { label: 'Tabla', value: 'pi pi-table' },
        { label: 'Etiquetas', value: 'pi pi-tags' },
        { label: 'Compras', value: 'pi pi-shopping-cart' },
        { label: 'Caja', value: 'pi pi-box' },
        { label: 'Moneda', value: 'pi pi-dollar' },
        { label: 'Descargas', value: 'pi pi-download' },
        { label: 'Cargas', value: 'pi pi-upload' },
        { label: 'Acciones', value: 'pi pi-bolt' },
        { label: 'Editar', value: 'pi pi-pencil' },
        { label: 'Eliminar', value: 'pi pi-trash' },
        { label: 'Guardar', value: 'pi pi-save' },
        { label: 'Detalle', value: 'pi pi-eye' },
        { label: 'Favorito', value: 'pi pi-star' },
        { label: 'Historial', value: 'pi pi-history' },
        { label: 'Soporte', value: 'pi pi-life-ring' },
        { label: 'Ayuda', value: 'pi pi-question-circle' },
        { label: 'Estado', value: 'pi pi-check-circle' },
        { label: 'Advertencia', value: 'pi pi-exclamation-triangle' },
        { label: 'Información', value: 'pi pi-info-circle' },
        { label: 'Bloqueado', value: 'pi pi-lock' },
        { label: 'Desbloqueado', value: 'pi pi-lock-open' },
        { label: 'Link', value: 'pi pi-link' },
        { label: 'Código', value: 'pi pi-code' },
        { label: 'Servidor', value: 'pi pi-server' },
        { label: 'Base de datos', value: 'pi pi-database' },
        { label: 'Nube', value: 'pi pi-cloud' },
        { label: 'Sincronizar', value: 'pi pi-sync' },
        { label: 'Mapa', value: 'pi pi-map' },
        { label: 'Ubicación', value: 'pi pi-map-marker' },
        { label: 'Teléfono', value: 'pi pi-phone' },
        { label: 'Video', value: 'pi pi-video' },
        { label: 'Imagen', value: 'pi pi-image' },
        { label: 'Filtro', value: 'pi pi-filter' },
        { label: 'Ordenar', value: 'pi pi-sort' },
        { label: 'Imprimir', value: 'pi pi-print' },
        { label: 'Enviar', value: 'pi pi-send' },
        { label: 'Integración', value: 'pi pi-share-alt' }
    ];

    cargando = signal(false);
    guardando = signal(false);

    mostrarDialog = false;
    mostrarCatalogoIconos = false;
    esNuevo = true;
    enviado = false;
    filtroCatalogoIconos = '';

    menuSeleccionado: MenuResponse | null = null;

    form: {
        label: string;
        route: string;
        icon: string;
        parentId: number | null;
        peso: number | null;
        activo: boolean;
    } = this.formVacio();

    ngOnInit() {
        this.cargarMenus();
    }

    cargarMenus() {
        this.cargando.set(true);
        this.menuService.listar().subscribe({
            next: (data) => {
                this.menus.set(data);
                this.reconstruirOpcionesPadre();
                this.cargando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de menús.' });
                this.cargando.set(false);
            }
        });
    }

    abrirNuevo() {
        this.esNuevo = true;
        this.menuSeleccionado = null;
        this.form = this.formVacio();
        this.enviado = false;
        this.reconstruirOpcionesPadre();
        this.mostrarDialog = true;
    }

    editarMenu(menu: MenuResponse) {
        this.esNuevo = false;
        this.menuSeleccionado = menu;
        this.form = {
            label: menu.label ?? '',
            route: menu.route ?? '',
            icon: menu.icon ?? '',
            parentId: menu.parentId ?? null,
            peso: menu.peso ?? null,
            activo: menu.activo !== false
        };
        this.enviado = false;
        this.reconstruirOpcionesPadre(menu.id);
        this.mostrarDialog = true;
    }

    guardar() {
        this.enviado = true;
        if (!this.form.label?.trim()) {
            return;
        }

        if (this.esNuevo) {
            const request: CrearMenuRequest = {
                label: this.form.label.trim(),
                route: this.limpiarTexto(this.form.route),
                icon: this.limpiarTexto(this.form.icon),
                parentId: this.form.parentId,
                peso: this.form.peso ?? undefined
            };

            this.guardando.set(true);
            this.menuService.crear(request).subscribe({
                next: (nuevo) => {
                    this.menus.update((lista) => [...lista, nuevo]);
                    this.reconstruirOpcionesPadre();
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Menú creado correctamente.' });
                    this.cerrarDialog();
                    this.guardando.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el menú.' });
                    this.guardando.set(false);
                }
            });

            return;
        }

        const request: ActualizarMenuRequest = {
            label: this.form.label.trim(),
            route: this.limpiarTexto(this.form.route),
            icon: this.limpiarTexto(this.form.icon),
            parentId: this.form.parentId,
            peso: this.form.peso ?? undefined,
            activo: this.form.activo
        };

        this.guardando.set(true);
        this.menuService.actualizar(this.menuSeleccionado!.id, request).subscribe({
            next: (actualizado) => {
                this.menus.update((lista) => lista.map((m) => (m.id === actualizado.id ? actualizado : m)));
                this.reconstruirOpcionesPadre();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Menú actualizado correctamente.' });
                this.cerrarDialog();
                this.guardando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el menú.' });
                this.guardando.set(false);
            }
        });
    }

    confirmarEliminar(menu: MenuResponse) {
        this.confirmationService.confirm({
            message: `¿Desea eliminar el menú <strong>${menu.label}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.menuService.eliminar(menu.id).subscribe({
                    next: () => {
                        this.menus.update((lista) => lista.filter((m) => m.id !== menu.id));
                        this.reconstruirOpcionesPadre();
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Menú eliminado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el menú.' });
                    }
                });
            }
        });
    }

    cerrarDialog() {
        this.mostrarDialog = false;
        this.form = this.formVacio();
        this.enviado = false;
        this.filtroCatalogoIconos = '';
    }

    abrirCatalogoIconos() {
        this.mostrarCatalogoIconos = true;
    }

    cerrarCatalogoIconos() {
        this.mostrarCatalogoIconos = false;
        this.filtroCatalogoIconos = '';
    }

    seleccionarIcono(icono: string) {
        this.form.icon = icono;
        this.mostrarCatalogoIconos = false;
        this.filtroCatalogoIconos = '';
    }

    iconosFiltrados(): IconoMenuOption[] {
        const termino = this.filtroCatalogoIconos.trim().toLowerCase();
        if (!termino) {
            return this.opcionesIcono;
        }

        return this.opcionesIcono.filter((icono) => icono.label.toLowerCase().includes(termino) || icono.value.toLowerCase().includes(termino));
    }

    filtroGlobal(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    obtenerLabelPadre(parentId?: number | null): string {
        if (parentId === null || typeof parentId === 'undefined') {
            return '-';
        }

        return this.menus().find((m) => m.id === parentId)?.label ?? '-';
    }

    private reconstruirOpcionesPadre(excluirId?: number) {
        const opciones = this.menus()
            .filter((menu) => menu.id !== excluirId)
            .map((menu) => ({
                label: menu.label,
                value: menu.id
            }));

        this.opcionesPadre.set(opciones);
    }

    private limpiarTexto(value: string): string | null {
        const limpio = value?.trim();
        return limpio ? limpio : null;
    }

    private formVacio() {
        return {
            label: '',
            route: '',
            icon: '',
            parentId: null,
            peso: null,
            activo: true
        };
    }
}
