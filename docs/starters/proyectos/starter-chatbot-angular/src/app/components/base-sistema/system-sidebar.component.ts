import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemMenu } from './system-menu.component';

@Component({
    selector: 'app-system-sidebar',
    standalone: true,
    imports: [CommonModule, SystemMenu],
    template: `
        <div class="layout-sidebar">
            <app-system-menu></app-system-menu>
        </div>
    `
})
export class SystemSidebar {
}
