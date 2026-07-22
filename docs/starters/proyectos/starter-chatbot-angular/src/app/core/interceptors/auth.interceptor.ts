import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor global para respuestas 401 del backend.
 * Solo actúa sobre peticiones a la API (localhost:8080/api).
 * Intenta refrescar el token silenciosamente antes de redirigir al login.
 */
export function authErrorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const authService = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Solo manejar 401 de nuestra propia API, no de Authentik ni otros
            if (error.status !== 401 || !req.url.includes('/api/')) {
                return throwError(() => error);
            }

            if (authService.tieneRefreshToken) {
                // Intentar refresh silencioso y reintentar la petición original
                return from(authService.refrescarToken()).pipe(
                    switchMap(() => {
                        const token = authService.obtenerToken();
                        const reintento = token
                            ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
                            : req;
                        return next(reintento);
                    }),
                    catchError(() => {
                        // Refresh también falló: diferir la limpieza fuera del ciclo de CD
                        setTimeout(() => {
                            authService.limpiarSesion();
                            router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
                        });
                        return throwError(() => error);
                    })
                );
            }

            // Sin refresh token: diferir la limpieza fuera del ciclo de CD
            setTimeout(() => {
                authService.limpiarSesion();
                router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
            });
            return throwError(() => error);
        })
    );
}
