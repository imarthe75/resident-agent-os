import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
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
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PrivilegioResponse, PrivilegioService } from '@/app/pages/service/privilegio.service';
import { ActualizarRecursoEndpointRequest, CrearRecursoEndpointRequest, RecursoEndpointResponse, RecursoEndpointService } from '@/app/pages/service/recurso-endpoint.service';

const METODOS_HTTP = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' }
];

@Component({
    selector: 'app-recursos',
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
        TextareaModule,
        SelectModule,
        MultiSelectModule
    ],
    providers: [MessageService, ConfirmationService],
    styles: [
        `
            :host ::ng-deep .recursos-privilegios-dialog .p-dialog-content {
                max-height: min(68vh, 36rem);
                overflow: auto;
            }
        `
    ],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo recurso" icon="pi pi-plus" severity="secondary" (onClick)="abrirNuevo()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="recursos()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['antPattern', 'metodoHttp', 'descripcion']"
            [tableStyle]="{ 'min-width': '64rem' }"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} recursos"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [loading]="cargando()"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestión de Recursos de Endpoint</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="filtroGlobal(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th pSortableColumn="metodoHttp" style="min-width: 8rem">
                        Método
                        <p-sortIcon field="metodoHttp" />
                    </th>
                    <th pSortableColumn="antPattern" style="min-width: 22rem">
                        Ant Pattern
                        <p-sortIcon field="antPattern" />
                    </th>
                    <th pSortableColumn="descripcion" style="min-width: 18rem">
                        Descripción
                        <p-sortIcon field="descripcion" />
                    </th>
                    <th pSortableColumn="activo" style="min-width: 8rem">
                        Activo
                        <p-sortIcon field="activo" />
                    </th>
                    <th style="min-width: 14rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-recurso>
                <tr>
                    <td>
                        <p-tag [value]="recurso.metodoHttp" [severity]="severidadMetodo(recurso.metodoHttp)" />
                    </td>
                    <td>
                        <span class="font-mono text-sm">{{ recurso.antPattern }}</span>
                    </td>
                    <td>{{ recurso.descripcion || '-' }}</td>
                    <td>
                        <p-tag [value]="recurso.activo ? 'Activo' : 'Inactivo'" [severity]="recurso.activo ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button
                            icon="pi pi-key"
                            class="mr-2"
                            [rounded]="true"
                            [outlined]="true"
                            severity="warn"
                            pTooltip="Gestionar privilegios requeridos"
                            tooltipPosition="top"
                            [loading]="guardandoPrivilegios() && recursoSeleccionadoParaPrivilegios()?.id === recurso.id"
                            (onClick)="abrirPrivilegios(recurso)"
                        />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarRecurso(recurso)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarEliminar(recurso)" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="5" class="text-center p-6">No hay recursos de endpoint registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Dialog CRUD -->
        <p-dialog
            [(visible)]="mostrarDialog"
            [style]="{ width: '520px', 'max-width': '95vw' }"
            [header]="esNuevo ? 'Nuevo Recurso de Endpoint' : 'Editar Recurso de Endpoint'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="metodoHttp" class="block font-bold mb-2">Método HTTP <span class="text-red-500">*</span></label>
                        <p-select
                            inputId="metodoHttp"
                            [options]="metodosHttp"
                            optionLabel="label"
                            optionValue="value"
                            [(ngModel)]="form.metodoHttp"
                            placeholder="Selecciona un método"
                            fluid
                        />
                        @if (enviado && !form.metodoHttp) {
                            <small class="text-red-500">El método HTTP es obligatorio.</small>
                        }
                    </div>

                    <div>
                        <label for="antPattern" class="block font-bold mb-2">Ant Pattern <span class="text-red-500">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="antPattern"
                            [(ngModel)]="form.antPattern"
                            placeholder="Ej: /api/usuarios/**"
                            required
                            fluid
                            style="font-family: monospace"
                        />
                        @if (enviado && !form.antPattern.trim()) {
                            <small class="text-red-500">El ant pattern es obligatorio.</small>
                        }
                    </div>

                    <div>
                        <label for="descripcion" class="block font-bold mb-2">Descripción</label>
                        <textarea
                            pTextarea
                            id="descripcion"
                            [(ngModel)]="form.descripcion"
                            rows="3"
                            placeholder="Describe qué protege este recurso"
                            fluid
                        ></textarea>
                    </div>

                    @if (!esNuevo) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="activoRecurso" />
                            <label for="activoRecurso">Activo</label>
                        </div>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardando()" (onClick)="guardar()" />
            </ng-template>
        </p-dialog>

        <!-- Dialog privilegios requeridos -->
        <p-dialog
            [(visible)]="mostrarPrivilegiosDialog"
            [style]="{ width: '680px', 'max-width': '96vw' }"
            [breakpoints]="{ '1100px': '88vw', '768px': '94vw', '640px': '98vw' }"
            styleClass="recursos-privilegios-dialog"
            header="Privilegios requeridos"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="text-sm text-surface-500">
                        Recurso:
                        <strong class="font-mono">
                            {{ recursoSeleccionadoParaPrivilegios()?.metodoHttp }}
                            {{ recursoSeleccionadoParaPrivilegios()?.antPattern }}
                        </strong>
                    </div>
                    @if (guardandoPrivilegios()) {
                        <div class="flex items-center gap-2 text-sm text-surface-500">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>Cargando privilegios...</span>
                        </div>
                    }
                    <div>
                        <label for="privilegiosRecurso" class="block font-bold mb-2">Privilegios requeridos</label>
                        <p-multiselect
                            inputId="privilegiosRecurso"
                            [options]="privilegiosDisponibles()"
                            optionLabel="nombre"
                            optionValue="id"
                            [filter]="true"
                            filterBy="nombre,descripcion"
                            [showClear]="true"
                            placeholder="Selecciona uno o más privilegios"
                            [(ngModel)]="privilegiosSeleccionadosIds"
                            styleClass="w-full"
                            [maxSelectedLabels]="3"
                            [scrollHeight]="'18rem'"
                            [appendTo]="'body'"
                            [disabled]="guardandoPrivilegios()"
                        >
                            <ng-template let-p #item>
                                <div class="flex flex-col gap-1 w-full min-w-0">
                                    <span class="font-mono text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{{ p.nombre }}</span>
                                    <span class="text-surface-500 text-xs overflow-hidden text-ellipsis whitespace-nowrap">{{ p.descripcion || 'Sin descripción' }}</span>
                                </div>
                            </ng-template>
                            <ng-template let-sel #selecteditems>
                                @if (!sel || !sel.length) {
                                    <span class="text-surface-500">Sin privilegios requeridos (acceso público)</span>
                                } @else {
                                    <span>{{ sel.length }} privilegio(s) requerido(s)</span>
                                }
                            </ng-template>
                        </p-multiselect>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarPrivilegiosDialog()" [disabled]="guardandoPrivilegios()" />
                <p-button
                    label="Guardar asignaciones"
                    icon="pi pi-check"
                    [loading]="guardandoPrivilegios()"
                    [disabled]="guardandoPrivilegios()"
                    (onClick)="guardarPrivilegios()"
                />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class RecursosComponent implements OnInit {
    private readonly recursoService = inject(RecursoEndpointService);
    private readonly privilegioService = inject(PrivilegioService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    readonly metodosHttp = METODOS_HTTP;

    recursos = signal<RecursoEndpointResponse[]>([]);
    privilegiosDisponibles = signal<PrivilegioResponse[]>([]);

    cargando = signal(false);
    guardando = signal(false);
    guardandoPrivilegios = signal(false);

    mostrarDialog = false;
    mostrarPrivilegiosDialog = false;
    esNuevo = true;
    enviado = false;

    recursoSeleccionado: RecursoEndpointResponse | null = null;
    recursoSeleccionadoParaPrivilegios = signal<RecursoEndpointResponse | null>(null);

    privilegiosSeleccionadosIds: number[] = [];
    private privilegiosAsignadosOriginalIds: number[] = [];

    form: { antPattern: string; metodoHttp: string; descripcion: string; activo: boolean } = this.formVacio();

    ngOnInit() {
        this.cargarRecursos();
    }

    cargarRecursos() {
        this.cargando.set(true);
        this.recursoService.listar().subscribe({
            next: (data) => {
                this.recursos.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de recursos.' });
                this.cargando.set(false);
            }
        });
    }

    abrirNuevo() {
        this.esNuevo = true;
        this.recursoSeleccionado = null;
        this.form = this.formVacio();
        this.enviado = false;
        this.mostrarDialog = true;
    }

    editarRecurso(recurso: RecursoEndpointResponse) {
        this.esNuevo = false;
        this.recursoSeleccionado = recurso;
        this.form = {
            antPattern: recurso.antPattern ?? '',
            metodoHttp: recurso.metodoHttp ?? '',
            descripcion: recurso.descripcion ?? '',
            activo: recurso.activo
        };
        this.enviado = false;
        this.mostrarDialog = true;
    }

    guardar() {
        this.enviado = true;
        if (!this.form.antPattern?.trim() || !this.form.metodoHttp) {
            return;
        }

        if (this.esNuevo) {
            const request: CrearRecursoEndpointRequest = {
                antPattern: this.form.antPattern.trim(),
                metodoHttp: this.form.metodoHttp,
                descripcion: this.form.descripcion.trim() || undefined
            };

            this.guardando.set(true);
            this.recursoService.crear(request).subscribe({
                next: (nuevo) => {
                    this.recursos.update((lista) => [...lista, nuevo]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recurso creado correctamente.' });
                    this.cerrarDialog();
                    this.guardando.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el recurso.' });
                    this.guardando.set(false);
                }
            });
            return;
        }

        const request: ActualizarRecursoEndpointRequest = {
            antPattern: this.form.antPattern.trim() || undefined,
            metodoHttp: this.form.metodoHttp || undefined,
            descripcion: this.form.descripcion.trim() || undefined,
            activo: this.form.activo
        };

        this.guardando.set(true);
        this.recursoService.actualizar(this.recursoSeleccionado!.id, request).subscribe({
            next: (actualizado) => {
                this.recursos.update((lista) => lista.map((r) => (r.id === actualizado.id ? actualizado : r)));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recurso actualizado correctamente.' });
                this.cerrarDialog();
                this.guardando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el recurso.' });
                this.guardando.set(false);
            }
        });
    }

    confirmarEliminar(recurso: RecursoEndpointResponse) {
        this.confirmationService.confirm({
            message: `¿Desea inactivar el recurso <strong>${recurso.metodoHttp} ${recurso.antPattern}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, inactivar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.recursoService.eliminar(recurso.id).subscribe({
                    next: () => {
                        this.recursos.update((lista) => lista.filter((r) => r.id !== recurso.id));
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recurso inactivado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inactivar el recurso.' });
                    }
                });
            }
        });
    }

    abrirPrivilegios(recurso: RecursoEndpointResponse) {
        this.recursoSeleccionadoParaPrivilegios.set(recurso);
        this.guardandoPrivilegios.set(true);
        this.mostrarPrivilegiosDialog = true;

        forkJoin({
            disponibles: this.privilegioService.listar(),
            asignados: this.recursoService.listarPrivilegiosPorRecurso(recurso.id)
        }).subscribe({
            next: ({ disponibles, asignados }) => {
                this.privilegiosDisponibles.set(disponibles.filter((p) => p.activo));
                this.privilegiosAsignadosOriginalIds = asignados.map((p) => p.id);
                this.privilegiosSeleccionadosIds = [...this.privilegiosAsignadosOriginalIds];
                this.guardandoPrivilegios.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los privilegios del recurso.' });
                this.mostrarPrivilegiosDialog = false;
                this.guardandoPrivilegios.set(false);
            }
        });
    }

    guardarPrivilegios() {
        const recurso = this.recursoSeleccionadoParaPrivilegios();
        if (!recurso) {
            return;
        }

        const actuales = new Set(this.privilegiosSeleccionadosIds);
        const originales = new Set(this.privilegiosAsignadosOriginalIds);

        const paraAsignar = this.privilegiosSeleccionadosIds.filter((id) => !originales.has(id));
        const paraDesasignar = this.privilegiosAsignadosOriginalIds.filter((id) => !actuales.has(id));

        if (!paraAsignar.length && !paraDesasignar.length) {
            this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios en las asignaciones.' });
            this.cerrarPrivilegiosDialog();
            return;
        }

        const asignaciones$ = paraAsignar.map((id) => this.recursoService.asignarPrivilegio(recurso.id, id));
        const desasignaciones$ = paraDesasignar.map((id) => this.recursoService.desasignarPrivilegio(recurso.id, id));

        this.guardandoPrivilegios.set(true);

        const acciones$ = [...asignaciones$, ...desasignaciones$];

        forkJoin(acciones$.length ? acciones$ : [of(null)])
            .pipe(switchMap(() => this.recursoService.listarPrivilegiosPorRecurso(recurso.id)))
            .subscribe({
                next: (actualizados) => {
                    this.privilegiosAsignadosOriginalIds = actualizados.map((p) => p.id);
                    this.privilegiosSeleccionadosIds = [...this.privilegiosAsignadosOriginalIds];
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Privilegios actualizados correctamente.' });
                    this.cerrarPrivilegiosDialog();
                    this.guardandoPrivilegios.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar los privilegios.' });
                    this.guardandoPrivilegios.set(false);
                }
            });
    }

    cerrarDialog() {
        this.mostrarDialog = false;
        this.form = this.formVacio();
        this.enviado = false;
    }

    cerrarPrivilegiosDialog() {
        this.mostrarPrivilegiosDialog = false;
        this.recursoSeleccionadoParaPrivilegios.set(null);
        this.privilegiosSeleccionadosIds = [];
        this.privilegiosAsignadosOriginalIds = [];
    }

    filtroGlobal(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    severidadMetodo(metodo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const mapa: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            GET: 'success',
            POST: 'info',
            PUT: 'warn',
            PATCH: 'warn',
            DELETE: 'danger'
        };
        return mapa[metodo] ?? 'secondary';
    }

    private formVacio() {
        return { antPattern: '', metodoHttp: '', descripcion: '', activo: true };
    }
}
