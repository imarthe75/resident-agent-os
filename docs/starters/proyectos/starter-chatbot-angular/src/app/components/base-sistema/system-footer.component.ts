import { Component } from '@angular/core';

@Component({
    selector: 'app-system-footer',
    standalone: true,
    template: `
        <div class="layout-footer py-4 border-t border-surface mt-auto">
            <div class="flex items-center justify-between text-surface-500 text-sm px-4">
                <span>&copy; 2026 <b>C&A SMART SYSTEMS</b>. Todos los derechos reservados.</span>
                <div class="flex gap-4">
                    <a href="javascript:void(0)" class="hover:text-primary transition-colors">Términos</a>
                    <a href="javascript:void(0)" class="hover:text-primary transition-colors">Privacidad</a>
                </div>
            </div>
        </div>
    `
})
export class SystemFooter {}
