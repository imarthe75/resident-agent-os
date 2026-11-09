---
name: frontend-reordenacion-arquitectonica
description: Reorganiza un proyecto Angular desordenado hacia la arquitectura por features de la plantilla base (core/shared/features, standalone, señales, inject(), ApiService/API_ENDPOINTS, guards y storage centralizado) en 4 pasos verificables, sin romper la compilación. Úsala para migrar o modernizar un frontend heredado.
---

# Reordenación arquitectónica de un frontend Angular

Lleva un proyecto heredado al modelo de la plantilla base (la plantilla base Angular). Se ejecuta en 4 pasos, en orden; cada paso termina con
`ng build` y las pruebas en verde antes de seguir, y en una rama propia (`using-git-worktrees`).

| Paso | Archivo | Resultado |
|---|---|---|
| 1. Mapeo y migración | [`pasos/1-mapeo_y_migracion.md`](pasos/1-mapeo_y_migracion.md) | Inventario de archivos y movimiento a `core/`, `shared/`, `features/<modulo>/` |
| 2. Modernización Angular | [`pasos/2-modernizacion_angular.md`](pasos/2-modernizacion_angular.md) | Componentes standalone, señales, `inject()`, control de flujo `@if/@for`, sin `any` |
| 3. Centralización HTTP | [`pasos/3-centralizacion_http.md`](pasos/3-centralizacion_http.md) | `ApiService` + `API_ENDPOINTS`, interceptores, sin `HttpClient` en features |
| 4. Seguridad y rutas | [`pasos/4-seguridad_y_rutas.md`](pasos/4-seguridad_y_rutas.md) | `APP_ROUTES`, guards funcionales, storage solo en el servicio de autenticación |

Estructura de destino detallada: [`estructura_features.md`](estructura_features.md).

## Reglas
- No mezclar reorganización con cambios de comportamiento: un commit mueve, otro moderniza.
- Antes de empezar, registrar la línea base: `ng build`, pruebas y un escaneo de seguridad del repositorio; al terminar, el número de
  hallazgos no debe subir (`preflight`, la guía de corrección del escáner del proyecto).
- La autenticación queda como en `frontend-auth-oidc`; la seguridad de componentes como en `generacion-componentes-ts` §7b.
- Lo que no se pudo migrar se declara pendiente; no se deja código comentado «por si acaso».

## Reglas del escáner que esta skill evita
`ANGULAR-SUBSCRIBE-NO-CLEANUP`, `ANGULAR-NESTED-SUBSCRIBE`, `ANGULAR-EFFECT-HTTP`, `ANGULAR-SIGNAL-MUTATION-IN-PLACE`, `FRONTEND-HARDCODED-API-URL`, `FRONTEND-TEST-ROUTE-EXPOSED`, `TS-EXPLICIT-ANY`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
