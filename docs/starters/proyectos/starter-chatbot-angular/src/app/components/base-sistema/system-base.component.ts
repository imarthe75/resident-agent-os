import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SystemTopbar } from './system-topbar.component';
import { SystemSidebar } from './system-sidebar.component';
import { SystemFooter } from './system-footer.component';
import { LayoutService } from '@/app/layout/service/layout.service';
import { ChatbotWidgetComponent } from '../chatbot-widget/chatbot-widget.component';

@Component({
    selector: 'app-system-base',
    standalone: true,
    imports: [CommonModule, SystemTopbar, SystemSidebar, RouterModule, SystemFooter, ChatbotWidgetComponent],
    template: `
        <div class="layout-wrapper" [ngClass]="containerClass()">
            <app-system-topbar></app-system-topbar>
            <app-system-sidebar></app-system-sidebar>
            <div class="layout-main-container">
                <div class="layout-main">
                    <router-outlet></router-outlet>
                </div>
                <app-system-footer></app-system-footer>
            </div>
            <div class="layout-mask"></div>
            <app-chatbot-widget [profileId]="'general'" [endpoint]="'http://localhost:3001'"></app-chatbot-widget>
        </div>
    `
})
export class SystemBaseComponent {
    layoutService = inject(LayoutService);

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });
    }

    containerClass = computed(() => {
        const config = this.layoutService.layoutConfig();
        const state = this.layoutService.layoutState();
        return {
            'layout-overlay': config.menuMode === 'overlay',
            'layout-static': config.menuMode === 'static',
            'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
            'layout-overlay-active': state.overlayMenuActive,
            'layout-mobile-active': state.mobileMenuActive
        };
    });
}
