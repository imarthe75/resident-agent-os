import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuService } from '@/app/core/services/menu.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu {
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
