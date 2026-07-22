import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/services/auth.service';
import { UsuarioContextoService } from '@/app/core/services/usuario-contexto.service';

@Component({
    selector: 'app-system-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, TooltipModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/dashboard">
                <!-- Logo corporativo -->
                <i class="pi pi-shield text-primary text-4xl mr-2"></i>
                <span class="font-bold text-xl uppercase tracking-wider text-surface-900 dark:text-surface-0">SISTEMA CORE</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            @if (rolesDisponibles().length) {
                <div class="layout-config-menu">
                    <label for="selectorRol" class="sr-only">Rol activo</label>
                    <select
                        id="selectorRol"
                        class="layout-topbar-action h-10 min-w-52 bg-surface-0 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-md px-3"
                        [ngModel]="rolSeleccionadoId()"
                        [disabled]="usuarioContextoService.cargando()"
                        (ngModelChange)="onRolChange($event)"
                    >
                        @for (rol of rolesDisponibles(); track rol.id) {
                            <option [ngValue]="rol.id">{{ rol.nombre }}</option>
                        }
                    </select>
                </div>
            }

            @if (mensajeContexto()) {
                <div class="hidden md:flex text-sm font-medium text-amber-600 dark:text-amber-400 max-w-96 truncate" [pTooltip]="mensajeContexto() ?? ''">
                    {{ mensajeContexto() }}
                </div>
            }

            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <div class="layout-topbar-menu">
                <div class="layout-topbar-menu-content">
                    <button
                        type="button"
                        class="layout-topbar-action"
                        [pTooltip]="tooltipPerfil"
                        tooltipPosition="bottom"
                    >
                        <i class="pi pi-user"></i>
                        <span>{{ nombreUsuario || 'Mi Perfil' }}</span>
                    </button>
                    <button type="button" class="layout-topbar-action text-red-500" (click)="onLogout()">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class SystemTopbar {
    layoutService = inject(LayoutService);
    authService = inject(AuthService);
    usuarioContextoService = inject(UsuarioContextoService);

    rolSeleccionadoId = signal<number | null>(null);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    rolesDisponibles = this.usuarioContextoService.roles;
    mensajeContexto = this.usuarioContextoService.mensaje;

    onRolChange(value: number | string) {
        const rolId = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(rolId) || this.usuarioContextoService.rolActivoId() === rolId) {
            this.rolSeleccionadoId.set(this.usuarioContextoService.rolActivoId());
            return;
        }

        this.rolSeleccionadoId.set(rolId);
        void this.usuarioContextoService.cambiarRol(rolId);
    }

    onLogout() {
        this.authService.logout();
    }

    get nombreUsuario(): string {
        return this.authService.nombreUsuario;
    }

    get tooltipPerfil(): string {
        const claims = this.authService.claims;
        const nombre = this.authService.nombreUsuario;
        const username = (claims['preferred_username'] as string) ?? (claims['email'] as string) ?? (claims['sub'] as string) ?? '';

        if (nombre && username && nombre !== username) {
            return `${nombre} (${username})`;
        }

        return nombre || username || 'Usuario autenticado';
    }

    constructor() {
        effect(() => {
            this.rolSeleccionadoId.set(this.usuarioContextoService.rolActivoId());
        });
    }
}
