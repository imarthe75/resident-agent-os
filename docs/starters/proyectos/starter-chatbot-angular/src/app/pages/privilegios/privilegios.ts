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
import { ActualizarPrivilegioRequest, CrearPrivilegioRequest, PrivilegioResponse, PrivilegioService } from '@/app/pages/service/privilegio.service';

@Component({
    selector: 'app-privilegios',
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
        TextareaModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo privilegio" icon="pi pi-plus" severity="secondary" (onClick)="abrirNuevo()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="privilegios()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombre', 'descripcion']"
            [tableStyle]="{ 'min-width': '52rem' }"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} privilegios"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [loading]="cargando()"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestión de Privilegios</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="filtroGlobal(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th pSortableColumn="nombre" style="min-width: 18rem">
                        Nombre
                        <p-sortIcon field="nombre" />
                    </th>
                    <th pSortableColumn="descripcion" style="min-width: 22rem">
                        Descripción
                        <p-sortIcon field="descripcion" />
                    </th>
                    <th pSortableColumn="activo" style="min-width: 8rem">
                        Activo
                        <p-sortIcon field="activo" />
                    </th>
                    <th style="min-width: 10rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-privilegio>
                <tr>
                    <td>
                        <span class="font-mono text-sm">{{ privilegio.nombre }}</span>
                    </td>
                    <td>{{ privilegio.descripcion || '-' }}</td>
                    <td>
                        <p-tag [value]="privilegio.activo ? 'Activo' : 'Inactivo'" [severity]="privilegio.activo ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarPrivilegio(privilegio)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarEliminar(privilegio)" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="4" class="text-center p-6">No hay privilegios registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog
            [(visible)]="mostrarDialog"
            [style]="{ width: '480px', 'max-width': '95vw' }"
            [header]="esNuevo ? 'Nuevo Privilegio' : 'Editar Privilegio'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="nombre" class="block font-bold mb-2">Nombre <span class="text-red-500">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="nombre"
                            [(ngModel)]="form.nombre"
                            placeholder="Ej: USUARIOS_READ"
                            required
                            autofocus
                            fluid
                            style="font-family: monospace"
                        />
                        @if (enviado && !form.nombre.trim()) {
                            <small class="text-red-500">El nombre es obligatorio.</small>
                        }
                        <small class="text-surface-500 mt-1 block">Usa el patrón MÓDULO_ACCIÓN (ej: USUARIOS_READ, REPORTES_WRITE).</small>
                    </div>

                    <div>
                        <label for="descripcion" class="block font-bold mb-2">Descripción</label>
                        <textarea
                            pTextarea
                            id="descripcion"
                            [(ngModel)]="form.descripcion"
                            rows="3"
                            placeholder="Describe qué acción o recurso protege este privilegio"
                            fluid
                        ></textarea>
                    </div>

                    @if (!esNuevo) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="activoPrivilegio" />
                            <label for="activoPrivilegio">Activo</label>
                        </div>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="cerrarDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardando()" (onClick)="guardar()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class PrivilegiosComponent implements OnInit {
    private readonly privilegioService = inject(PrivilegioService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    privilegios = signal<PrivilegioResponse[]>([]);
    cargando = signal(false);
    guardando = signal(false);

    mostrarDialog = false;
    esNuevo = true;
    enviado = false;

    privilegioSeleccionado: PrivilegioResponse | null = null;

    form: { nombre: string; descripcion: string; activo: boolean } = this.formVacio();

    ngOnInit() {
        this.cargarPrivilegios();
    }

    cargarPrivilegios() {
        this.cargando.set(true);
        this.privilegioService.listar().subscribe({
            next: (data) => {
                this.privilegios.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de privilegios.' });
                this.cargando.set(false);
            }
        });
    }

    abrirNuevo() {
        this.esNuevo = true;
        this.privilegioSeleccionado = null;
        this.form = this.formVacio();
        this.enviado = false;
        this.mostrarDialog = true;
    }

    editarPrivilegio(privilegio: PrivilegioResponse) {
        this.esNuevo = false;
        this.privilegioSeleccionado = privilegio;
        this.form = {
            nombre: privilegio.nombre ?? '',
            descripcion: privilegio.descripcion ?? '',
            activo: privilegio.activo
        };
        this.enviado = false;
        this.mostrarDialog = true;
    }

    guardar() {
        this.enviado = true;
        if (!this.form.nombre?.trim()) {
            return;
        }

        if (this.esNuevo) {
            const request: CrearPrivilegioRequest = {
                nombre: this.form.nombre.trim().toUpperCase(),
                descripcion: this.form.descripcion.trim() || undefined
            };

            this.guardando.set(true);
            this.privilegioService.crear(request).subscribe({
                next: (nuevo) => {
                    this.privilegios.update((lista) => [...lista, nuevo]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Privilegio creado correctamente.' });
                    this.cerrarDialog();
                    this.guardando.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el privilegio.' });
                    this.guardando.set(false);
                }
            });
            return;
        }

        const request: ActualizarPrivilegioRequest = {
            nombre: this.form.nombre.trim().toUpperCase() || undefined,
            descripcion: this.form.descripcion.trim() || undefined,
            activo: this.form.activo
        };

        this.guardando.set(true);
        this.privilegioService.actualizar(this.privilegioSeleccionado!.id, request).subscribe({
            next: (actualizado) => {
                this.privilegios.update((lista) => lista.map((p) => (p.id === actualizado.id ? actualizado : p)));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Privilegio actualizado correctamente.' });
                this.cerrarDialog();
                this.guardando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el privilegio.' });
                this.guardando.set(false);
            }
        });
    }

    confirmarEliminar(privilegio: PrivilegioResponse) {
        this.confirmationService.confirm({
            message: `¿Desea inactivar el privilegio <strong>${privilegio.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, inactivar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.privilegioService.eliminar(privilegio.id).subscribe({
                    next: () => {
                        this.privilegios.update((lista) => lista.filter((p) => p.id !== privilegio.id));
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Privilegio inactivado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inactivar el privilegio.' });
                    }
                });
            }
        });
    }

    cerrarDialog() {
        this.mostrarDialog = false;
        this.form = this.formVacio();
        this.enviado = false;
    }

    filtroGlobal(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    private formVacio() {
        return { nombre: '', descripcion: '', activo: true };
    }
}
