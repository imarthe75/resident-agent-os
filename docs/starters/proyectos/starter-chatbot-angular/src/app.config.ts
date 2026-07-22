import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { OAuthModule } from 'angular-oauth2-oidc';
import { appRoutes } from './app.routes';
import { CASmartPreset } from './app/layout/service/ca-smart.theme';
import { initOidc } from './app/core/auth/oidc.initializer';
import { initUsuarioContexto } from './app/core/auth/usuario-contexto.initializer';
import { authErrorInterceptor } from './app/core/interceptors/auth.interceptor';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authErrorInterceptor]), withInterceptorsFromDi()),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: CASmartPreset, options: { darkModeSelector: '.app-dark' } } }),
        importProvidersFrom(
            OAuthModule.forRoot({
                resourceServer: {
                    allowedUrls: [environment.apiBaseUrl],
                    sendAccessToken: true
                }
            })
        ),
        {
            provide: APP_INITIALIZER,
            useFactory: initOidc,
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initUsuarioContexto,
            multi: true
        }
    ]
};
