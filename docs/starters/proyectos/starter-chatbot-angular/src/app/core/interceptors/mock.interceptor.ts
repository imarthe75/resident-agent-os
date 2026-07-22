import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';

/**
 * Interceptor de Simulación (Mock).
 * Captura las peticiones a la API de auth y devuelve un JWT ficticio
 * para poder trabajar en el frontend sin depender de un backend real.
 */
export function mockInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    // Simulamos el login
    if (req.url.endsWith('/api/auth/login') && req.method === 'POST') {
        const body: any = req.body;
        console.log('Mock Interceptor - Capturando Login:', body);

        // Simulamos una respuesta exitosa con un JWT falso
        const mockResponse = new HttpResponse({
            status: 200,
            body: {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                usuario: {
                    nombre: 'Desarrollador CA',
                    correo: body.correo || 'admin@ca-smarts.com'
                }
            }
        });

        return of(mockResponse).pipe(delay(800)); // Simulamos latencia de red
    }

    return next(req);
}
