import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { UsuarioContextoService } from '../services/usuario-contexto.service';

/**
 * Directiva estructural que muestra o elimina un elemento del DOM
 * según si el usuario tiene el permiso indicado en su rol activo.
 *
 * Uso:
 *   <button *appIfPermiso="'USUARIOS_WRITE'">Crear usuario</button>
 */
@Directive({
    selector: '[appIfPermiso]',
    standalone: true
})
export class IfPermisoDirective {
    private readonly tpl = inject(TemplateRef<unknown>);
    private readonly vcr = inject(ViewContainerRef);
    private readonly usuarioContexto = inject(UsuarioContextoService);

    private permiso = '';
    private hasView = false;

    @Input()
    set appIfPermiso(permiso: string) {
        this.permiso = permiso;
        this.actualizarVista();
    }

    constructor() {
        effect(() => {
            // Re-evaluar cuando cambien los permisos (ej. cambio de rol)
            this.usuarioContexto.permisos();
            this.actualizarVista();
        });
    }

    private actualizarVista(): void {
        const tiene = this.usuarioContexto.tienePermiso(this.permiso);

        if (tiene && !this.hasView) {
            this.vcr.createEmbeddedView(this.tpl);
            this.hasView = true;
        } else if (!tiene && this.hasView) {
            this.vcr.clear();
            this.hasView = false;
        }
    }
}
