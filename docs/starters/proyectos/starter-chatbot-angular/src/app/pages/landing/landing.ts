import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, ButtonModule],
    template: `
        <div class="min-h-screen bg-surface-100 text-surface-900 dark:bg-surface-900 dark:text-surface-0">
            <header class="sticky top-0 z-20 border-b border-surface-300 bg-surface-0/95 backdrop-blur-sm dark:bg-surface-900/95">
                <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                    <a routerLink="/" class="text-3xl font-black tracking-tight text-primary">C&A SMARTS</a>

                    <nav class="hidden items-center gap-10 text-sm font-medium text-surface-700 dark:text-surface-200 md:flex">
                        <a href="#funcionalidades" class="transition-colors hover:text-primary">Funcionalidades</a>
                        <a href="#precios" class="transition-colors hover:text-primary">Precios</a>
                        <a href="#nosotros" class="transition-colors hover:text-primary">Nosotros</a>
                    </nav>

                    <button pButton type="button" label="Acceder" routerLink="/auth/login" styleClass="!px-6 !py-2 !text-sm"></button>
                </div>
            </header>

            <main>
                <section class="mx-auto max-w-6xl px-6 pb-24 pt-28 text-center">
                    <h1 class="text-5xl font-extrabold tracking-tight text-surface-900 dark:text-surface-0 md:text-6xl">Starter Backend CASMART</h1>
                    <p class="mx-auto mt-8 max-w-4xl text-xl text-surface-700 dark:text-surface-200">
                        Plantilla base para servicios internos, construida con Spring Boot, JWT (Authentik) y OpenAPI.
                    </p>
                    <div class="mt-14 flex flex-wrap items-center justify-center gap-4">
                        <button pButton type="button" label="Comenzar" routerLink="/auth/login" styleClass="!px-10 !py-3"></button>
                        <button pButton type="button" label="Ver Documentación" severity="secondary" [outlined]="true" styleClass="!px-10 !py-3"></button>
                    </div>
                </section>

                <section id="funcionalidades" class="border-y border-surface-300 bg-surface-200 px-6 py-16 dark:border-surface-700 dark:bg-surface-800">
                    <div class="mx-auto max-w-6xl">
                        <div class="text-center">
                            <h2 class="text-5xl font-bold text-surface-900 dark:text-surface-0">Diseñado para Profesionales</h2>
                            <p class="mt-5 text-xl text-surface-600 dark:text-surface-300">Todo lo necesario para desplegar servicios robustos en tiempo récord.</p>
                        </div>

                        <div class="mt-16 grid gap-6 md:grid-cols-3">
                            @for (feature of features; track feature.title) {
                                <article class="rounded-xl border border-surface-300 bg-surface-0 p-8 shadow-sm dark:border-surface-600 dark:bg-surface-900">
                                    <div class="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200">
                                        <i [class]="feature.icon"></i>
                                    </div>
                                    <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">{{ feature.title }}</h3>
                                    <p class="mt-4 text-lg leading-relaxed text-surface-700 dark:text-surface-200">{{ feature.description }}</p>
                                </article>
                            }
                        </div>
                    </div>
                </section>

                <section id="precios" class="bg-primary-900 px-6 py-20 text-center text-surface-0">
                    <div class="mx-auto max-w-4xl">
                        <h2 class="text-5xl font-extrabold">¿Listo para escalar tu próximo proyecto?</h2>
                        <p class="mt-6 text-xl leading-relaxed text-surface-100">
                            Únete a los equipos que construyen el futuro de los servicios corporativos con C&A SMARTS.
                        </p>
                        <button pButton type="button" label="Comenzar ahora" routerLink="/auth/login" styleClass="!mt-10 !px-12 !py-3"></button>
                    </div>
                </section>
            </main>

            <footer id="nosotros" class="border-t border-surface-300 bg-surface-100 dark:border-surface-700 dark:bg-surface-900">
                <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6 text-sm text-surface-700 dark:text-surface-300">
                    <span class="font-extrabold tracking-wide text-surface-900 dark:text-surface-0">C&A SMARTS</span>
                    <div class="flex items-center gap-6">
                        <a href="#" class="transition-colors hover:text-primary">Política de Privacidad</a>
                        <a href="#" class="transition-colors hover:text-primary">Términos de Servicio</a>
                        <a href="#" class="transition-colors hover:text-primary">Contacto</a>
                    </div>
                    <span>© 2024 CASMART. Todos los derechos reservados.</span>
                </div>
            </footer>
        </div>
    `
})
export class Landing {
    protected readonly features = [
        {
            icon: 'pi pi-shield text-2xl',
            title: 'Seguridad Robusta',
            description: 'Validación de tokens JWT con Authentik y Spring Security para un control de acceso centralizado.'
        },
        {
            icon: 'pi pi-box text-2xl',
            title: 'Stack Moderno',
            description: 'Java 21, Spring Boot 4 y PostgreSQL con migraciones Liquibase para un desarrollo escalable.'
        },
        {
            icon: 'pi pi-sparkles text-2xl',
            title: 'Documentación API',
            description: 'Swagger UI y contrato OpenAPI integrados por defecto para facilitar el consumo de tus servicios.'
        }
    ];
}
