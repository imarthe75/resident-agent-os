import { Component, OnInit, signal, ViewChild, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { UsuarioService, UsuarioResponse, CrearUsuarioRequest, ActualizarUsuarioRequest } from '@/app/pages/service/usuario.service';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CheckboxModule
    ],
    providers: [MessageService, ConfirmationService, UsuarioService],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="usuarios()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['username', 'nombres', 'primerApellido', 'correo']"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [loading]="cargando()"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestión de Usuarios</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="filtroGlobal(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th pSortableColumn="username" style="min-width: 12rem">
                        Username
                        <p-sortIcon field="username" />
                    </th>
                    <th pSortableColumn="primerApellido" style="min-width: 14rem">
                        Nombre completo
                        <p-sortIcon field="primerApellido" />
                    </th>
                    <th pSortableColumn="correo" style="min-width: 16rem">
                        Correo
                        <p-sortIcon field="correo" />
                    </th>
                    <th pSortableColumn="activo" style="min-width: 8rem">
                        Activo
                        <p-sortIcon field="activo" />
                    </th>
                    <th pSortableColumn="fechaCreacion" style="min-width: 12rem">
                        Fecha de creación
                        <p-sortIcon field="fechaCreacion" />
                    </th>
                    <th style="min-width: 10rem"></th>
                </tr>
            </ng-template>

            <ng-template #body let-usuario>
                <tr>
                    <td>{{ usuario.username }}</td>
                    <td>{{ usuario.nombres }} {{ usuario.primerApellido }} {{ usuario.segundoApellido }}</td>
                    <td>{{ usuario.correo }}</td>
                    <td>
                        <p-tag [value]="usuario.activo ? 'Activo' : 'Inactivo'" [severity]="usuario.activo ? 'success' : 'danger'" />
                    </td>
                    <td>{{ usuario.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editarUsuario(usuario)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="confirmarEliminar(usuario)" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="6" class="text-center p-6">No hay usuarios registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Diálogo crear/editar -->
        <p-dialog
            [(visible)]="mostrarDialog"
            [style]="{ width: '480px' }"
            [header]="esNuevo ? 'Nuevo Usuario' : 'Editar Usuario'"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="username" class="block font-bold mb-2">Username @if (esNuevo) { <span class="text-red-500">*</span> }</label>
                        @if (esNuevo) {
                            <input type="text" pInputText id="username" [(ngModel)]="form.username" required autofocus fluid />
                            @if (enviado && !form.username) {
                                <small class="text-red-500">El username es obligatorio.</small>
                            }
                        } @else {
                            <input type="text" pInputText id="username" [value]="usuarioSeleccionado?.username" [disabled]="true" fluid />
                        }
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="nombres" class="block font-bold mb-2">Nombres</label>
                            <input type="text" pInputText id="nombres" [(ngModel)]="form.nombres" fluid />
                        </div>
                        <div>
                            <label for="primerApellido" class="block font-bold mb-2">Primer apellido</label>
                            <input type="text" pInputText id="primerApellido" [(ngModel)]="form.primerApellido" fluid />
                        </div>
                    </div>
                    <div>
                        <label for="segundoApellido" class="block font-bold mb-2">Segundo apellido</label>
                        <input type="text" pInputText id="segundoApellido" [(ngModel)]="form.segundoApellido" fluid />
                    </div>
                    <div>
                        <label for="correo" class="block font-bold mb-2">Correo electrónico</label>
                        <input type="email" pInputText id="correo" [(ngModel)]="form.correo" fluid />
                    </div>
                    <div>
                        <label for="urlFotoPerfil" class="block font-bold mb-2">URL foto de perfil</label>
                        <input type="text" pInputText id="urlFotoPerfil" [(ngModel)]="form.urlFotoPerfil" fluid />
                    </div>
                    @if (!esNuevo) {
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="activo" />
                            <label for="activo">Activo</label>
                        </div>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="cerrarDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="guardando()" (click)="guardar()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class UsuariosComponent implements OnInit {
    private readonly usuarioService = inject(UsuarioService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    usuarios = signal<UsuarioResponse[]>([]);
    cargando = signal(false);
    guardando = signal(false);

    mostrarDialog = false;
    esNuevo = true;
    enviado = false;
    usuarioSeleccionado: UsuarioResponse | null = null;

    form: {
        username: string;
        nombres: string;
        primerApellido: string;
        segundoApellido: string;
        correo: string;
        urlFotoPerfil: string;
        activo: boolean;
    } = this.formVacio();

    ngOnInit() {
        this.cargarUsuarios();
    }

    cargarUsuarios() {
        this.cargando.set(true);
        this.usuarioService.listar().subscribe({
            next: (data) => {
                this.usuarios.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de usuarios.' });
                this.cargando.set(false);
            }
        });
    }

    abrirNuevo() {
        this.esNuevo = true;
        this.usuarioSeleccionado = null;
        this.form = this.formVacio();
        this.enviado = false;
        this.mostrarDialog = true;
    }

    editarUsuario(usuario: UsuarioResponse) {
        this.esNuevo = false;
        this.usuarioSeleccionado = usuario;
        this.form = {
            username: '',
            nombres: usuario.nombres ?? '',
            primerApellido: usuario.primerApellido ?? '',
            segundoApellido: usuario.segundoApellido ?? '',
            correo: usuario.correo ?? '',
            urlFotoPerfil: usuario.urlFotoPerfil ?? '',
            activo: usuario.activo
        };
        this.enviado = false;
        this.mostrarDialog = true;
    }

    guardar() {
        this.enviado = true;

        if (this.esNuevo) {
            if (!this.form.username?.trim()) return;

            const request: CrearUsuarioRequest = {
                username: this.form.username.trim(),
                nombres: this.form.nombres || undefined,
                primerApellido: this.form.primerApellido || undefined,
                segundoApellido: this.form.segundoApellido || undefined,
                correo: this.form.correo || undefined,
                urlFotoPerfil: this.form.urlFotoPerfil || undefined
            };

            this.guardando.set(true);
            this.usuarioService.crear(request).subscribe({
                next: (nuevo) => {
                    this.usuarios.update((lista) => [...lista, nuevo]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente.' });
                    this.cerrarDialog();
                    this.guardando.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el usuario.' });
                    this.guardando.set(false);
                }
            });
        } else {
            const request: ActualizarUsuarioRequest = {
                nombres: this.form.nombres || undefined,
                primerApellido: this.form.primerApellido || undefined,
                segundoApellido: this.form.segundoApellido || undefined,
                correo: this.form.correo || undefined,
                urlFotoPerfil: this.form.urlFotoPerfil || undefined,
                activo: this.form.activo
            };

            this.guardando.set(true);
            this.usuarioService.actualizar(this.usuarioSeleccionado!.id, request).subscribe({
                next: (actualizado) => {
                    this.usuarios.update((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente.' });
                    this.cerrarDialog();
                    this.guardando.set(false);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario.' });
                    this.guardando.set(false);
                }
            });
        }
    }

    confirmarEliminar(usuario: UsuarioResponse) {
        this.confirmationService.confirm({
            message: `¿Desea eliminar al usuario <strong>${usuario.nombres ?? usuario.correo}</strong>? Esta acción también lo eliminará de Authentik.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.usuarioService.eliminar(usuario.id).subscribe({
                    next: () => {
                        this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado correctamente.' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario.' });
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
        return { username: '', nombres: '', primerApellido: '', segundoApellido: '', correo: '', urlFotoPerfil: '', activo: true };
    }
}
