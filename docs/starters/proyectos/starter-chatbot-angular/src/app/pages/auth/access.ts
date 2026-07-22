import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { UsuarioContextoService } from '../../core/services/usuario-contexto.service';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(247, 149, 48, 0.4) 10%, rgba(247, 149, 48, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                        <div class="gap-4 flex flex-col items-center">
                            <div class="flex justify-center items-center border-2 border-orange-500 rounded-full" style="width: 3.2rem; height: 3.2rem">
                                <i class="text-orange-500 pi pi-fw pi-lock text-2xl!"></i>
                            </div>
                            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-5xl mb-2">Acceso denegado</h1>
                            <span class="text-muted-color mb-8 text-center">
                                No tienes permisos para acceder a esta sección.<br />
                                Contacta al administrador del sistema si crees que es un error.
                            </span>
                            <div class="flex items-center justify-center border-4 border-orange-200 dark:border-orange-900 rounded-full bg-orange-50 dark:bg-orange-950" style="width: 10rem; height: 10rem">
                                <i class="pi pi-ban text-orange-400" style="font-size: 5rem;"></i>
                            </div>
                            <div class="mt-8 flex gap-3">
                                <p-button label="Ir al inicio" icon="pi pi-home" routerLink="/" severity="warn" />
                                @if (contexto.rolActivoId()) {
                                    <p-button label="Cambiar rol" icon="pi pi-refresh" routerLink="/" [outlined]="true" severity="warn" />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Access {
    readonly contexto = inject(UsuarioContextoService);
}
