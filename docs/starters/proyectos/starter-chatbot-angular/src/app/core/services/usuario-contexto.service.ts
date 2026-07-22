import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { ResponseDto } from '@/app/core/models/response-dto.model';

interface RolSesionResponse {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    peso: number;
}

interface MenuPlanoResponse {
    id: number;
    label: string;
    route?: string | null;
    icon?: string | null;
    parentId?: number | null;
    peso?: number | null;
}

interface MenuArbolResponse {
    id: number;
    label: string;
    route?: string | null;
    icon?: string | null;
    parentId?: number | null;
    peso?: number | null;
    hijos?: MenuArbolResponse[];
}

interface UsuarioMeResponse {
    usuarioId: string;
    sub: string;
    username: string;
    email: string;
    rolActivoId: number;
    rolesClaims: string[];
    roles: RolSesionResponse[];
    menus: MenuPlanoResponse[];
    menusArbol: MenuArbolResponse[];
    permisos: string[];
}

type EstadoContexto = 'ok' | 'sin-sesion' | 'rol-invalido' | 'usuario-no-sincronizado' | 'error';

@Injectable({ providedIn: 'root' })
export class UsuarioContextoService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    private readonly _contexto = signal<UsuarioMeResponse | null>(null);
    private readonly _cargando = signal(false);
    private readonly _estado = signal<EstadoContexto>('sin-sesion');
    private readonly _mensaje = signal<string | null>(null);
    private readonly _inicializado = signal(false);

    readonly cargando = this._cargando.asReadonly();
    readonly estado = this._estado.asReadonly();
    readonly mensaje = this._mensaje.asReadonly();
    readonly inicializado = this._inicializado.asReadonly();

    readonly roles = computed(() => this._contexto()?.roles ?? []);
    readonly rolActivoId = computed(() => this._contexto()?.rolActivoId ?? null);
    readonly usuarioNoSincronizado = computed(() => this._estado() === 'usuario-no-sincronizado');

    readonly permisos = computed(() => this._contexto()?.permisos ?? []);

    readonly rutasMenu = computed<Set<string>>(() => {
        const menus = this._contexto()?.menus ?? [];
        return new Set(
            menus
                .filter((m) => m.route)
                .map((m) => (m.route!.startsWith('/') ? m.route! : '/' + m.route!))
        );
    });

    tienePermiso(permiso: string): boolean {
        return this.permisos().includes(permiso);
    }

    tieneAccesoRuta(ruta: string): boolean {
        const rutasSet = this.rutasMenu();
        if (!rutasSet.size) return false;
        const normalizada = ruta.startsWith('/') ? ruta : '/' + ruta;
        return rutasSet.has(normalizada);
    }

    readonly menuItems = computed<MenuItem[]>(() => {
        const contexto = this._contexto();
        if (!contexto) {
            return [];
        }

        if (contexto.menusArbol?.length) {
            return this.asegurarInicio(this.convertirArbolAMenuItems(contexto.menusArbol));
        }

        return this.asegurarInicio(this.convertirPlanoAMenuItems(contexto.menus ?? []));
    });

    async cargarContextoInicial(tieneTokenValido: boolean): Promise<void> {
        if (!tieneTokenValido) {
            this._contexto.set(null);
            this._estado.set('sin-sesion');
            this._mensaje.set(null);
            this._inicializado.set(true);
            return;
        }

        await this.cargarContexto();
    }

    async asegurarContextoCargado(tieneTokenValido: boolean): Promise<void> {
        if (!tieneTokenValido) {
            this._contexto.set(null);
            this._estado.set('sin-sesion');
            this._mensaje.set(null);
            this._inicializado.set(true);
            return;
        }

        if (this._inicializado() && this._contexto()) {
            return;
        }

        await this.cargarContexto();
    }

    async cambiarRol(rolId: number): Promise<void> {
        await this.cargarContexto(rolId, true);
    }

    private async cargarContexto(rolId?: number, reintentoSinRol = false): Promise<void> {
        this._cargando.set(true);

        try {
            const params = typeof rolId === 'number' ? new HttpParams().set('rolId', rolId) : undefined;
            const contexto = await firstValueFrom(
                this.http
                    .get<ResponseDto<UsuarioMeResponse>>(`${this.apiBaseUrl}/usuarios/me`, { params })
                    .pipe(map((r) => r.data))
            );

            if (!contexto) {
                this._estado.set('error');
                this._mensaje.set('No se recibió contexto de sesión del backend.');
                return;
            }

            this._contexto.set(contexto);
            this._estado.set('ok');
            this._mensaje.set(null);
            this._inicializado.set(true);
        } catch (error) {
            this._inicializado.set(true);
            this.manejarErrorCarga(error, rolId, reintentoSinRol);
        } finally {
            this._cargando.set(false);
        }
    }

    private manejarErrorCarga(error: unknown, rolId?: number, reintentoSinRol = false) {
        if (!(error instanceof HttpErrorResponse)) {
            this._estado.set('error');
            this._mensaje.set('No se pudo cargar el contexto de sesión.');
            return;
        }

        if (error.status === 400 && typeof rolId === 'number' && reintentoSinRol) {
            this._estado.set('rol-invalido');
            this._mensaje.set('El rol seleccionado ya no está disponible para tu usuario. Se recargó tu contexto.');
            void this.cargarContexto();
            return;
        }

        if (error.status === 404) {
            this._contexto.set(null);
            this._estado.set('usuario-no-sincronizado');
            this._mensaje.set('Tu usuario no está sincronizado en el sistema. Contacta al equipo de soporte.');
            return;
        }

        if (error.status === 401) {
            this._contexto.set(null);
            this._estado.set('sin-sesion');
            this._mensaje.set('Tu sesión expiró. Inicia sesión nuevamente.');
            return;
        }

        this._estado.set('error');
        this._mensaje.set('No se pudo cargar el contexto de sesión.');
    }

    private convertirArbolAMenuItems(nodos: MenuArbolResponse[]): MenuItem[] {
        return [...nodos]
            .sort((a, b) => (a.peso ?? Number.MAX_SAFE_INTEGER) - (b.peso ?? Number.MAX_SAFE_INTEGER))
            .map((nodo) => {
                const ruta = this.normalizarRuta(nodo.route);
                const children = nodo.hijos?.length ? this.convertirArbolAMenuItems(nodo.hijos) : undefined;

                return {
                    id: String(nodo.id),
                    label: nodo.label,
                    icon: this.normalizarIcono(nodo.icon),
                    path: ruta,
                    routerLink: ruta ? [ruta] : undefined,
                    items: children,
                } as MenuItem;
            });
    }

    private convertirPlanoAMenuItems(menus: MenuPlanoResponse[]): MenuItem[] {
        const ordenados = [...menus].sort((a, b) => (a.peso ?? Number.MAX_SAFE_INTEGER) - (b.peso ?? Number.MAX_SAFE_INTEGER));
        const nodeMap = new Map<number, MenuItem & { parentId: number | null }>();
        const roots: Array<MenuItem & { parentId: number | null }> = [];

        ordenados.forEach((menu) => {
            const ruta = this.normalizarRuta(menu.route);
            nodeMap.set(menu.id, {
                id: String(menu.id),
                parentId: menu.parentId ?? null,
                label: menu.label,
                icon: this.normalizarIcono(menu.icon),
                path: ruta,
                routerLink: ruta ? [ruta] : undefined,
                items: []
            });
        });

        nodeMap.forEach((node) => {
            if (node.parentId !== null && nodeMap.has(node.parentId)) {
                const parent = nodeMap.get(node.parentId);
                parent?.items?.push(node);
                return;
            }

            roots.push(node);
        });

        return roots;
    }

    private normalizarRuta(route?: string | null): string | null {
        if (!route) {
            return null;
        }

        return route.startsWith('/') ? route : `/${route}`;
    }

    private normalizarIcono(icon?: string | null): string {
        if (!icon) {
            return 'pi pi-fw pi-circle';
        }

        return icon.startsWith('pi ') ? icon : `pi pi-fw ${icon}`;
    }

    private asegurarInicio(items: MenuItem[]): MenuItem[] {
        const indiceInicio = items.findIndex((item) => {
            const label = item.label?.toLowerCase().trim();
            const path = (item['path'] as string | undefined) ?? (Array.isArray(item.routerLink) ? item.routerLink[0] : undefined);
            return label === 'inicio' || path === '/dashboard';
        });

        if (indiceInicio >= 0) {
            const inicio = items[indiceInicio];
            const resto = items.filter((_, idx) => idx !== indiceInicio);
            return [inicio, ...resto];
        }

        return [
            {
                id: 'inicio-fallback',
                label: 'Inicio',
                icon: 'pi pi-fw pi-home',
                path: '/dashboard',
                routerLink: ['/dashboard']
            } as MenuItem,
            ...items
        ];
    }
}