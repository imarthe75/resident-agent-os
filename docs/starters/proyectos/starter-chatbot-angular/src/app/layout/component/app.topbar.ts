import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <svg width="40" height="40" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#FDFDFD" />
                            <stop offset="100%" stop-color="#A0A0A0" />
                        </linearGradient>
                        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#3FA9F5" />
                            <stop offset="100%" stop-color="#1B1464" />
                        </linearGradient>
                    </defs>
                    <!-- Small orbital lines -->
                    <path d="M 50 150 Q 200 50 350 150" stroke="#C0C0C0" stroke-width="4" fill="none" opacity="0.5" />
                    <path d="M 40 160 Q 200 260 360 160" stroke="#3FA9F5" stroke-width="2" fill="none" opacity="0.4" />
                    
                    <!-- Stylized Letters -->
                    <text x="40" y="190" font-family="Verdana, Geneva, sans-serif" font-weight="900" font-size="160" fill="url(#silverGrad)" style="filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.1))">C</text>
                    <text x="160" y="170" font-family="Verdana, Geneva, sans-serif" font-weight="bold" font-size="90" fill="#3FA9F5">&</text>
                    <text x="220" y="190" font-family="Verdana, Geneva, sans-serif" font-weight="900" font-size="160" fill="url(#blueGrad)" style="filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.1))">A</text>
                    
                    <!-- Subtitle -->
                    <text x="200" y="260" font-family="Verdana, Geneva, sans-serif" font-weight="lighter" font-size="28" fill="#707070" text-anchor="middle" letter-spacing="12">SMART SYSTEMS</text>
                </svg>
                <span>CA SMARTS</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}
