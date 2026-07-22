import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UsuarioResponse, UsuarioService } from '@/app/pages/service/usuario.service';
import { ActualizarRolRequest, CrearRolRequest, RolResponse, RolService } from '@/app/pages/service/rol.service';
import { MenuResponse, MenuService } from '@/app/pages/service/menu.service';
import { PrivilegioResponse, PrivilegioService } from '@/app/pages/service/privilegio.service';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [
        CommonModule,
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
        MultiSelectModule
    ],
    providers: [MessageService, ConfirmationService],
    styles: [
        `
            :host ::ng-deep .roles-usuarios-multiselect-panel .p-multiselect-item {
                align-items: flex-start;
                padding-top: 0.65rem;
                padding-bottom: 0.65rem;
            }

            :host ::ng-deep .roles-usuarios-multiselect-panel .usuario-option {
                min-width: 0;
            }

            :host ::ng-deep .roles-usuarios-multiselect-panel .usuario-option__nombre,
            :host ::ng-deep .roles-usuarios-multiselect-panel .usuario-option__correo {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            :host ::ng-deep .roles-usuarios-multiselect-panel .usuario-option__correo {
                color: var(--p-text-muted-color);
                font-size: 0.82rem;
            }

            :host ::ng-deep .roles-menus-multiselect-panel .menu-option {
                min-width: 0;
            }

            :host ::ng-deep .roles-menus-multiselect-panel .menu-option__label,
            :host ::ng-deep .roles-menus-multiselect-panel .menu-option__route {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            :host ::ng-deep .roles-menus-multiselect-panel .menu-option__route {
                color: var(--p-text-muted-color);
                font-size: 0.82rem;
            }

            :host ::ng-deep .roles-asignacion-dialog .p-dialog-content {
                max-height: min(68vh, 36rem);
                overflow: auto;
            }

            @media (max-width: 640px) {
                :host ::ng-deep .roles-asignacion-dialog .p-dialog-content {
                    max-height: 62vh;
                }
            }

            :host ::ng-deep .roles-privilegios-panel .p-multiselect-item {
                align-items: flex-start;
                padding-top: 0.65rem;
                padding-bottom: 0.65rem;
            }
        `
    ],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo rol" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="roles()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['codigo', 'nombre', 'descripcion']"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} roles"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [loading]="cargando()"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestión de Roles</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="filtroGlobal(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th pSortableColumn="codigo" style="min-width: 10rem">
                        Código
                        <p-sortIcon field="codigo" />
                    </th>
                    <th pSortableColumn="nombre" style="min-width: 14rem">
                        Nombre
                        <p-sortIcon field="nombre" />
                    </th>
                    <th pSortableColumn="descripcion" style="min-width: 18rem">
                        Descripción
                        <p-sortIcon field="descripcion" />
                    </th>
                    <th pSortableColumn="activo" style="min-width: 8rem">
                        Activo
                        <p-sortIcon field="activo" />
                    </th>
                    <th style="min-width: 18rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-rol>
                <tr>
                    <td>{{ rol.codigo }}</td>
                    <td>{{ rol.nombre }}</td>
                    <td>{{ rol.descripcion || '-' }}</td>
                    <td>
                        <p-tag [value]="rol.activo ? 'Activo' : 'Inactivo'" [severity]="rol.activo ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button
                            icon="pi pi-users"
                            class="mr-2"
                            [rounded]="true"
                            [outlined]="true"
                            severity="info"
                            [loading]="guardandoAsignacion() && rolSeleccionadoParaAsignacion()?.id === rol.id"
                            (onClick)="abrirAsignacion(rol)"
                        />
                        <p-button
                            icon="pi pi-sitemap"
                            class="mr-2"
                            [rounded]="true"
                            [outlined]="true"
                            severity="help"
                            [loading]="guardandoAsignacionMenus() && rolSeleccionadoParaMenus()?.id === rol.id"
                            (onClick)="abrirAsignacionMenus(rol)"
                        />
                        <p-button
                            icon="pi pi-key"
                            class="mr-2"
                            [rounded]="true"
                            [outlined]="true"
                            severity="warn"
                            [loading]="guardandoAsignacionPrivilegios() && rolSeleccionadoParaPrivilegios()?.id === rol.id"
                            (onClick)="abrirAsignacionPrivilegios(rol)"
                        />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarRol(rol)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarEliminar(rol)" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="5" class="text-center p-6">No hay roles registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog
            [(visible)]="mostrarDialog"
            [style]="{ width: '480px' }"
            [header]="esNuevo ? 'Nuevo Rol' : 'Editar Rol'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="codigo" class="block font-bold mb-2">Código <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="codigo" [(ngModel)]="form.codigo" required autofocus fluid />
                        @if (enviado && !form.codigo) {
                            <small class="text-red-500">El código es obligatorio.</small>
                        }
                    </div>
                    <div>
                        <label for="nombre" class="block font-bold mb-2">Nombre <span class="text-red-500">*</span></label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="form.nombre" required fluid />
                        @if (enviado && !form.nombre) {
                            <small class="text-red-500">El nombre es obligatorio.</small>
                        }
                    </div>
                    <div>
                        <label for="descripcion" class="block font-bold mb-2">Descripción</label>
                        <input type="text" pInputText id="descripcion" [(ngModel)]="form.descripcion" fluid />
                    </div>
                    @if (!esNuevo) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="activoRol" />
                            <label for="activoRol">Activo</label>
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
            [(visible)]="mostrarAsignacionDialog"
            [style]="{ width: '680px', 'max-width': '96vw' }"
            [breakpoints]="{ '1100px': '88vw', '768px': '94vw', '640px': '98vw' }"
            styleClass="roles-asignacion-dialog"
            header="Asignar usuarios al rol"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="text-sm text-surface-500">
                        Rol: <strong>{{ rolSeleccionadoParaAsignacion()?.nombre }}</strong>
                    </div>
                    @if (guardandoAsignacion()) {
                        <div class="flex items-center gap-2 text-sm text-surface-500">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>Cargando usuarios...</span>
                        </div>
                    }
                    <div>
                        <label for="usuariosRol" class="block font-bold mb-2">Usuarios</label>
                        <p-multiselect
                            inputId="usuariosRol"
                            [options]="usuariosDisponibles()"
                            optionLabel="correo"
                            optionValue="id"
                            [filter]="true"
                            filterBy="correo,nombres,primerApellido,segundoApellido"
                            [showClear]="true"
                            [placeholder]="'Selecciona uno o más usuarios'"
                            [(ngModel)]="usuariosSeleccionadosIds"
                            styleClass="w-full"
                            panelStyleClass="roles-usuarios-multiselect-panel"
                            [maxSelectedLabels]="3"
                            [scrollHeight]="'18rem'"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            [appendTo]="'body'"
                            [disabled]="guardandoAsignacion()"
                        >
                            <ng-template let-u #item>
                                <div class="usuario-option flex flex-col gap-1 w-full">
                                    <span class="usuario-option__nombre">{{ u.nombres }} {{ u.primerApellido }} {{ u.segundoApellido || '' }}</span>
                                    <span class="usuario-option__correo">{{ u.correo }}</span>
                                </div>
                            </ng-template>
                            <ng-template let-u #selecteditems>
                                @if (!u || !u.length) {
                                    <span class="text-surface-500">Selecciona uno o más usuarios</span>
                                } @else {
                                    <span>{{ u.length }} usuario(s) seleccionado(s)</span>
                                }
                            </ng-template>
                        </p-multiselect>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarAsignacionDialog()" [disabled]="guardandoAsignacion()" />
                <p-button
                    label="Guardar asignaciones"
                    icon="pi pi-check"
                    [loading]="guardandoAsignacion()"
                    [disabled]="guardandoAsignacion()"
                    (onClick)="guardarAsignaciones()"
                />
            </ng-template>
        </p-dialog>

        <p-dialog
            [(visible)]="mostrarAsignacionMenusDialog"
            [style]="{ width: '680px', 'max-width': '96vw' }"
            [breakpoints]="{ '1100px': '88vw', '768px': '94vw', '640px': '98vw' }"
            styleClass="roles-asignacion-dialog"
            header="Asignar menús al rol"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="text-sm text-surface-500">
                        Rol: <strong>{{ rolSeleccionadoParaMenus()?.nombre }}</strong>
                    </div>
                    @if (guardandoAsignacionMenus()) {
                        <div class="flex items-center gap-2 text-sm text-surface-500">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>Cargando menús...</span>
                        </div>
                    }
                    <div>
                        <label for="menusRol" class="block font-bold mb-2">Menús</label>
                        <p-multiselect
                            inputId="menusRol"
                            [options]="menusDisponibles()"
                            optionLabel="label"
                            optionValue="id"
                            [filter]="true"
                            filterBy="label,route,icon"
                            [showClear]="true"
                            [placeholder]="'Selecciona uno o más menús'"
                            [(ngModel)]="menusSeleccionadosIds"
                            styleClass="w-full"
                            panelStyleClass="roles-menus-multiselect-panel"
                            [maxSelectedLabels]="3"
                            [scrollHeight]="'18rem'"
                            [virtualScroll]="true"
                            [virtualScrollItemSize]="44"
                            [appendTo]="'body'"
                            [disabled]="guardandoAsignacionMenus()"
                        >
                            <ng-template let-m #item>
                                <div class="menu-option flex flex-col gap-1 w-full">
                                    <span class="menu-option__label">{{ m.label }}</span>
                                    <span class="menu-option__route">{{ m.route || 'Sin ruta' }}</span>
                                </div>
                            </ng-template>
                            <ng-template let-m #selecteditems>
                                @if (!m || !m.length) {
                                    <span class="text-surface-500">Selecciona uno o más menús</span>
                                } @else {
                                    <span>{{ m.length }} menú(s) seleccionado(s)</span>
                                }
                            </ng-template>
                        </p-multiselect>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarAsignacionMenusDialog()" [disabled]="guardandoAsignacionMenus()" />
                <p-button
                    label="Guardar asignaciones"
                    icon="pi pi-check"
                    [loading]="guardandoAsignacionMenus()"
                    [disabled]="guardandoAsignacionMenus()"
                    (onClick)="guardarAsignacionesMenus()"
                />
            </ng-template>
        </p-dialog>

        <!-- Dialog privilegios del rol -->
        <p-dialog
            [(visible)]="mostrarAsignacionPrivilegiosDialog"
            [style]="{ width: '680px', 'max-width': '96vw' }"
            [breakpoints]="{ '1100px': '88vw', '768px': '94vw', '640px': '98vw' }"
            styleClass="roles-asignacion-dialog"
            header="Privilegios del rol"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="text-sm text-surface-500">
                        Rol: <strong>{{ rolSeleccionadoParaPrivilegios()?.nombre }}</strong>
                    </div>
                    @if (guardandoAsignacionPrivilegios()) {
                        <div class="flex items-center gap-2 text-sm text-surface-500">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>Cargando privilegios...</span>
                        </div>
                    }
                    <div>
                        <label for="privilegiosRol" class="block font-bold mb-2">Privilegios</label>
                        <p-multiselect
                            inputId="privilegiosRol"
                            [options]="privilegiosDisponibles()"
                            optionLabel="nombre"
                            optionValue="id"
                            [filter]="true"
                            filterBy="nombre,descripcion"
                            [showClear]="true"
                            placeholder="Selecciona uno o más privilegios"
                            [(ngModel)]="privilegiosSeleccionadosIds"
                            styleClass="w-full"
                            panelStyleClass="roles-privilegios-panel"
                            [maxSelectedLabels]="3"
                            [scrollHeight]="'18rem'"
                            [appendTo]="'body'"
                            [disabled]="guardandoAsignacionPrivilegios()"
                        >
                            <ng-template let-p #item>
                                <div class="flex flex-col gap-1 w-full min-w-0">
                                    <span class="font-mono text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{{ p.nombre }}</span>
                                    <span class="text-surface-500 text-xs overflow-hidden text-ellipsis whitespace-nowrap">{{ p.descripcion || 'Sin descripción' }}</span>
                                </div>
                            </ng-template>
                            <ng-template let-sel #selecteditems>
                                @if (!sel || !sel.length) {
                                    <span class="text-surface-500">Selecciona uno o más privilegios</span>
                                } @else {
                                    <span>{{ sel.length }} privilegio(s) seleccionado(s)</span>
                                }
                            </ng-template>
                        </p-multiselect>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarAsignacionPrivilegiosDialog()" [disabled]="guardandoAsignacionPrivilegios()" />
                <p-button
                    label="Guardar asignaciones"
                    icon="pi pi-check"
                    [loading]="guardandoAsignacionPrivilegios()"
                    [disabled]="guardandoAsignacionPrivilegios()"
                    (onClick)="guardarAsignacionesPrivilegios()"
                />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class RolesComponent implements OnInit {
    private readonly rolService = inject(RolService);
    private readonly usuarioService = inject(UsuarioService);
    private readonly menuService = inject(MenuService);
    private readonly privilegioService = inject(PrivilegioService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    roles = signal<RolResponse[]>([]);
    usuariosDisponibles = signal<UsuarioResponse[]>([]);
    menusDisponibles = signal<MenuResponse[]>([]);
    privilegiosDisponibles = signal<PrivilegioResponse[]>([]);

    cargando = signal(false);
    guardando = signal(false);
    guardandoAsignacion = signal(false);
    guardandoAsignacionMenus = signal(false);
    guardandoAsignacionPrivilegios = signal(false);

    mostrarDialog = false;
    mostrarAsignacionDialog = false;
    mostrarAsignacionMenusDialog = false;
    mostrarAsignacionPrivilegiosDialog = false;

    esNuevo = true;
    enviado = false;

    rolSeleccionado: RolResponse | null = null;
    rolSeleccionadoParaAsignacion = signal<RolResponse | null>(null);
    rolSeleccionadoParaMenus = signal<RolResponse | null>(null);
    rolSeleccionadoParaPrivilegios = signal<RolResponse | null>(null);

    usuariosSeleccionadosIds: string[] = [];
    private usuariosAsignadosOriginalIds: string[] = [];

    menusSeleccionadosIds: number[] = [];
    private menusAsignadosOriginalIds: number[] = [];

    privilegiosSeleccionadosIds: number[] = [];
    private privilegiosAsignadosOriginalIds: number[] = [];

    form: {
        codigo: string;
        nombre: string;
        descripcion: string;
        activo: boolean;
    } = this.formVacio();

    ngOnInit() {
        this.cargarRoles();
    }

    cargarRoles() {
        this.cargando.set(true);
        this.rolService.listar().subscribe({
            next: (data) => {
                this.roles.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de roles.' });
                this.cargando.set(false);
            }
        });
    }

    abrirNuevo() {
        this.esNuevo = true;
        this.rolSeleccionado = null;
        this.form = this.formVacio();
        this.enviado = false;
        this.mostrarDialog = true;
    }

    editarRol(rol: RolResponse) {
        this.esNuevo = false;
        this.rolSeleccionado = rol;
        this.form = {
            codigo: rol.codigo ?? '',
            nombre: rol.nombre ?? '',
            descripcion: rol.descripcion ?? '',
            activo: rol.activo
        };
        this.enviado = false;
        this.mostrarDialog = true;
    }

    guardar() {
        this.enviado = true;

        if (!this.form.codigo?.trim() || !this.form.nombre?.trim()) {
            return;
        }

        if (this.esNuevo) {
            const request: CrearRolRequest = {
                codigo: this.form.codigo.trim(),
                nombre: this.form.nombre.trim(),
                descripcion: this.form.descripcion || undefined
            };

            this.guardando.set(true);
            this.rolService.crear(request).subscribe({
                next: (nuevo) => {
                    this.roles.update((lista) => [...lista, nuevo]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado correctamente.' });
                    this.cerrarDialog();
                    this.guardando.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el rol.' });
                    this.guardando.set(false);
                }
            });
            return;
        }

        const request: ActualizarRolRequest = {
            codigo: this.form.codigo || undefined,
            nombre: this.form.nombre || undefined,
            descripcion: this.form.descripcion || undefined,
            activo: this.form.activo
        };

        this.guardando.set(true);
        this.rolService.actualizar(this.rolSeleccionado!.id, request).subscribe({
            next: (actualizado) => {
                this.roles.update((lista) => lista.map((r) => (r.id === actualizado.id ? actualizado : r)));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado correctamente.' });
                this.cerrarDialog();
                this.guardando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el rol.' });
                this.guardando.set(false);
            }
        });
    }

    confirmarEliminar(rol: RolResponse) {
        this.confirmationService.confirm({
            message: `¿Desea inactivar el rol <strong>${rol.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.rolService.eliminar(rol.id).subscribe({
                    next: () => {
                        this.roles.update((lista) => lista.filter((r) => r.id !== rol.id));
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el rol.' });
                    }
                });
            }
        });
    }

    abrirAsignacion(rol: RolResponse) {
        this.rolSeleccionadoParaAsignacion.set(rol);
        this.guardandoAsignacion.set(true);
        this.mostrarAsignacionDialog = true;

        forkJoin({
            usuarios: this.usuarioService.listar(),
            asignaciones: this.rolService.listarUsuariosPorRol(rol.id)
        }).subscribe({
            next: ({ usuarios, asignaciones }) => {
                this.usuariosDisponibles.set(usuarios.filter((u) => u.activo));
                this.usuariosAsignadosOriginalIds = asignaciones.map((a) => a.usuarioId);
                this.usuariosSeleccionadosIds = [...this.usuariosAsignadosOriginalIds];
                this.guardandoAsignacion.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la asignación de usuarios.' });
                this.mostrarAsignacionDialog = false;
                this.guardandoAsignacion.set(false);
            }
        });
    }

    guardarAsignaciones() {
        const rol = this.rolSeleccionadoParaAsignacion();
        if (!rol) {
            return;
        }

        const actuales = new Set(this.usuariosSeleccionadosIds);
        const originales = new Set(this.usuariosAsignadosOriginalIds);

        const paraAsignar = this.usuariosSeleccionadosIds.filter((id) => !originales.has(id));
        const paraDesasignar = this.usuariosAsignadosOriginalIds.filter((id) => !actuales.has(id));

        const asignaciones$ = paraAsignar.map((usuarioId) => this.rolService.asignarUsuario(rol.id, usuarioId));
        const desasignaciones$ = paraDesasignar.map((usuarioId) => this.rolService.desasignarUsuario(rol.id, usuarioId));

        if (!asignaciones$.length && !desasignaciones$.length) {
            this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios en las asignaciones.' });
            this.cerrarAsignacionDialog();
            return;
        }

        this.guardandoAsignacion.set(true);

        const acciones$ = [...asignaciones$, ...desasignaciones$];

        forkJoin(acciones$.length ? acciones$ : [of(null)])
            .pipe(switchMap(() => this.rolService.listarUsuariosPorRol(rol.id)))
            .subscribe({
                next: (asignacionesActualizadas) => {
                    this.usuariosAsignadosOriginalIds = asignacionesActualizadas.map((a) => a.usuarioId);
                    this.usuariosSeleccionadosIds = [...this.usuariosAsignadosOriginalIds];
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignaciones actualizadas correctamente.' });
                    this.cerrarAsignacionDialog();
                    this.guardandoAsignacion.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar las asignaciones.' });
                    this.guardandoAsignacion.set(false);
                }
            });
    }

    abrirAsignacionMenus(rol: RolResponse) {
        this.rolSeleccionadoParaMenus.set(rol);
        this.guardandoAsignacionMenus.set(true);
        this.mostrarAsignacionMenusDialog = true;

        forkJoin({
            menus: this.menuService.listar(),
            asignaciones: this.menuService.listarMenusPorRol(rol.id)
        }).subscribe({
            next: ({ menus, asignaciones }) => {
                this.menusDisponibles.set(menus.filter((m) => m.activo !== false));
                this.menusAsignadosOriginalIds = asignaciones.map((a) => a.id);
                this.menusSeleccionadosIds = [...this.menusAsignadosOriginalIds];
                this.guardandoAsignacionMenus.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la asignación de menús.' });
                this.mostrarAsignacionMenusDialog = false;
                this.guardandoAsignacionMenus.set(false);
            }
        });
    }

    guardarAsignacionesMenus() {
        const rol = this.rolSeleccionadoParaMenus();
        if (!rol) {
            return;
        }

        const actuales = new Set(this.menusSeleccionadosIds);
        const originales = new Set(this.menusAsignadosOriginalIds);

        const paraAsignar = this.menusSeleccionadosIds.filter((id) => !originales.has(id));
        const paraDesasignar = this.menusAsignadosOriginalIds.filter((id) => !actuales.has(id));

        const asignaciones$ = paraAsignar.map((menuId) => this.menuService.asignarMenu(rol.id, menuId));
        const desasignaciones$ = paraDesasignar.map((menuId) => this.menuService.desasignarMenu(rol.id, menuId));

        if (!asignaciones$.length && !desasignaciones$.length) {
            this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios en las asignaciones.' });
            this.cerrarAsignacionMenusDialog();
            return;
        }

        this.guardandoAsignacionMenus.set(true);

        const acciones$ = [...asignaciones$, ...desasignaciones$];

        forkJoin(acciones$.length ? acciones$ : [of(null)])
            .pipe(switchMap(() => this.menuService.listarMenusPorRol(rol.id)))
            .subscribe({
                next: (asignacionesActualizadas) => {
                    this.menusAsignadosOriginalIds = asignacionesActualizadas.map((a) => a.id);
                    this.menusSeleccionadosIds = [...this.menusAsignadosOriginalIds];
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignaciones actualizadas correctamente.' });
                    this.cerrarAsignacionMenusDialog();
                    this.guardandoAsignacionMenus.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar las asignaciones.' });
                    this.guardandoAsignacionMenus.set(false);
                }
            });
    }

    cerrarDialog() {
        this.mostrarDialog = false;
        this.form = this.formVacio();
        this.enviado = false;
    }

    cerrarAsignacionDialog() {
        this.mostrarAsignacionDialog = false;
        this.rolSeleccionadoParaAsignacion.set(null);
        this.usuariosSeleccionadosIds = [];
        this.usuariosAsignadosOriginalIds = [];
    }

    cerrarAsignacionMenusDialog() {
        this.mostrarAsignacionMenusDialog = false;
        this.rolSeleccionadoParaMenus.set(null);
        this.menusSeleccionadosIds = [];
        this.menusAsignadosOriginalIds = [];
    }

    abrirAsignacionPrivilegios(rol: RolResponse) {
        this.rolSeleccionadoParaPrivilegios.set(rol);
        this.guardandoAsignacionPrivilegios.set(true);
        this.mostrarAsignacionPrivilegiosDialog = true;

        forkJoin({
            privilegios: this.privilegioService.listar(),
            asignados: this.rolService.listarPrivilegiosPorRol(rol.id)
        }).subscribe({
            next: ({ privilegios, asignados }) => {
                this.privilegiosDisponibles.set(privilegios.filter((p) => p.activo));
                this.privilegiosAsignadosOriginalIds = asignados.map((p) => p.id);
                this.privilegiosSeleccionadosIds = [...this.privilegiosAsignadosOriginalIds];
                this.guardandoAsignacionPrivilegios.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la asignación de privilegios.' });
                this.mostrarAsignacionPrivilegiosDialog = false;
                this.guardandoAsignacionPrivilegios.set(false);
            }
        });
    }

    guardarAsignacionesPrivilegios() {
        const rol = this.rolSeleccionadoParaPrivilegios();
        if (!rol) {
            return;
        }

        const actuales = new Set(this.privilegiosSeleccionadosIds);
        const originales = new Set(this.privilegiosAsignadosOriginalIds);

        const paraAsignar = this.privilegiosSeleccionadosIds.filter((id) => !originales.has(id));
        const paraDesasignar = this.privilegiosAsignadosOriginalIds.filter((id) => !actuales.has(id));

        if (!paraAsignar.length && !paraDesasignar.length) {
            this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios en las asignaciones.' });
            this.cerrarAsignacionPrivilegiosDialog();
            return;
        }

        const asignaciones$ = paraAsignar.map((id) => this.rolService.asignarPrivilegio(rol.id, id));
        const desasignaciones$ = paraDesasignar.map((id) => this.rolService.desasignarPrivilegio(rol.id, id));

        this.guardandoAsignacionPrivilegios.set(true);

        const acciones$ = [...asignaciones$, ...desasignaciones$];

        forkJoin(acciones$.length ? acciones$ : [of(null)])
            .pipe(switchMap(() => this.rolService.listarPrivilegiosPorRol(rol.id)))
            .subscribe({
                next: (actualizados) => {
                    this.privilegiosAsignadosOriginalIds = actualizados.map((p) => p.id);
                    this.privilegiosSeleccionadosIds = [...this.privilegiosAsignadosOriginalIds];
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Privilegios actualizados correctamente.' });
                    this.cerrarAsignacionPrivilegiosDialog();
                    this.guardandoAsignacionPrivilegios.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar los privilegios.' });
                    this.guardandoAsignacionPrivilegios.set(false);
                }
            });
    }

    cerrarAsignacionPrivilegiosDialog() {
        this.mostrarAsignacionPrivilegiosDialog = false;
        this.rolSeleccionadoParaPrivilegios.set(null);
        this.privilegiosSeleccionadosIds = [];
        this.privilegiosAsignadosOriginalIds = [];
    }

    filtroGlobal(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private formVacio() {
        return {
            codigo: '',
            nombre: '',
            descripcion: '',
            activo: true
        };
    }
}
