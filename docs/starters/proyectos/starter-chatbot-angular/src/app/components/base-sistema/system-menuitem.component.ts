import { Component, computed, inject, input, signal, forwardRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: '[app-system-menuitem]',
    standalone: true,
    imports: [CommonModule, RouterModule, RippleModule, forwardRef(() => SystemMenuitem)],
    template: `
        @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
            <a
                [attr.href]="item().url"
                (click)="itemClick($event)"
                [ngClass]="[(item().class || ''), esInicio() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold border border-primary-200 dark:border-primary-700' : '']"
                [attr.target]="item().target"
                tabindex="0"
                pRipple
                class="flex items-center p-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-200 cursor-pointer"
            >
                <i [ngClass]="item().icon" class="layout-menuitem-icon mr-3 text-lg"></i>
                <span class="layout-menuitem-text flex-grow">{{ item().label }}</span>
                @if (hasChildren()) {
                    <i class="pi pi-fw pi-angle-down layout-submenu-toggler ml-auto transition-transform duration-200" [class.rotate-180]="isActive()"></i>
                }
            </a>
        }
        @if (hasRouterLink() && !hasChildren() && isVisible()) {
            <a
                (click)="itemClick($event)"
                [ngClass]="item().class"
                [routerLink]="item().routerLink"
                routerLinkActive="active-route bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold"
                [routerLinkActiveOptions]="item().routerLinkActiveOptions || { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"
                [fragment]="item().fragment"
                [queryParamsHandling]="item().queryParamsHandling"
                [preserveFragment]="item().preserveFragment"
                [skipLocationChange]="item().skipLocationChange"
                [replaceUrl]="item().replaceUrl"
                [state]="item().state"
                [queryParams]="item().queryParams"
                [attr.target]="item().target"
                tabindex="0"
                pRipple
                [ngClass]="esInicio() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold border border-primary-200 dark:border-primary-700' : ''"
                class="flex items-center p-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-200 cursor-pointer mb-1"
            >
                <i [ngClass]="item().icon" class="layout-menuitem-icon mr-3 text-lg"></i>
                <span class="layout-menuitem-text">{{ item().label }}</span>
            </a>
        }
        @if (hasChildren() && isVisible() && isActive()) {
            <ul class="list-none p-0 m-0 overflow-hidden transition-all duration-300 pl-4">
                @for (child of item().items; track child?.label) {
                    <li app-system-menuitem [item]="child" [parentPath]="fullPath()" [root]="false" [class]="child['badgeClass']"></li>
                }
            </ul>
        }
    `
})
export class SystemMenuitem {
    layoutService = inject(LayoutService);
    router = inject(Router);
    item = input<any>(null);
    root = input<boolean>(false);
    parentPath = input<string | null>(null);

    isVisible = computed(() => this.item()?.visible !== false);
    hasChildren = computed(() => this.item()?.items && this.item()?.items.length > 0);
    hasRouterLink = computed(() => !!this.item()?.routerLink);
    esInicio = computed(() => {
        const item = this.item();
        const label = item?.label?.toLowerCase()?.trim();
        const ruta = item?.path || (Array.isArray(item?.routerLink) ? item.routerLink[0] : null);
        return label === 'inicio' || ruta === '/dashboard';
    });

    fullPath = computed(() => {
        const itemPath = this.item()?.path;
        if (!itemPath) return this.parentPath();
        const parent = this.parentPath();
        if (parent && !itemPath.startsWith(parent)) {
            return parent + itemPath;
        }
        return itemPath;
    });

    isActive = signal<boolean>(false);

    itemClick(event: Event) {
        const item = this.item();
        if (item?.disabled) {
            event.preventDefault();
            return;
        }
        if (this.esInicio()) {
            this.isActive.set(false);
            return;
        }
        if (this.hasChildren()) {
            this.isActive.update(v => !v);
        }
    }
}
