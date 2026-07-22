import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SystemMenuitem } from './system-menuitem.component';
import { MenuService } from '@/app/core/services/menu.service';

@Component({
    selector: 'app-system-menu',
    standalone: true,
    imports: [CommonModule, SystemMenuitem],
    template: `
        <ul class="layout-menu">
            @for (item of model; track item.label) {
                @if (!item.separator) {
                    <li app-system-menuitem [item]="item" [root]="true"></li>
                } @else {
                    <li class="menu-separator"></li>
                }
            }
        </ul>
    `
})
export class SystemMenu implements OnInit {
    private readonly menuService = inject(MenuService);
    private readonly destroyRef = inject(DestroyRef);

    model: MenuItem[] = [];

    ngOnInit() {
        this.menuService
            .obtenerMenuPorUsuario()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((menu) => {
                this.model = menu;
            });
    }
}
