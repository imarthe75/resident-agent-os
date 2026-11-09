---
name: bdd-frontend-playwright
description: 'Guía y estándar agnóstico para agentes de IA para ejecutar Spec-Driven Development (SDD) y Behavior-Driven Development (BDD) en este Frontend (Angular 21 + PrimeNG 21) usando Playwright y Gherkin (.feature).'
---

# Skill: Spec-Driven Development (SDD) & BDD en Frontend con Playwright

Esta skill capacita a cualquier agente de inteligencia artificial para transformar reglas de negocio funcionales en **especificaciones Gherkin (`.feature`)** y **pruebas funcionales automatizadas de interfaz de usuario con Playwright** en `el proyecto frontend` (Angular 21 + PrimeNG 21).

---

## 🎯 Objetivo de la Skill

1. **Especificación Viva de UI:** Definir en archivos `.feature` (`Dado / Cuando / Entonces`) cómo debe comportarse la pantalla ante cada regla de negocio.
2. **Pruebas Funcionales Aisladas (Zero-DB Impact):** Ejecutar pruebas en un navegador real con Playwright interceptando las llamadas HTTP (`page.route`) e inyectando sesión simulada para **no afectar datos reales** ni depender de servicios externos (el proveedor de identidad, PostgreSQL, Backend).
3. **Validación de Lógica Real del Componente:** Evaluar el componente Angular real (`FormGroup`, Signals, validadores como `noSoloEspacios`, `maxLength`, estados `disabled`, `<p-table>`, `<p-dialog>`, `<p-confirmDialog>`).

---

## Alcance y honestidad del resultado
- Estas pruebas validan la **interfaz con la red simulada** (`page.route`): comportamiento de componentes, validadores, estados y mensajes.
  No prueban el backend ni la base de datos. Su resultado se reporta como «prueba de UI con API simulada», nunca como prueba de extremo a
  extremo ni como evidencia de que una regla de negocio funciona en el servidor.
- Las pruebas funcionales contra la aplicación desplegada (backend y base reales, usuarios por rol) se hacen con un ejecutor de pruebas funcionales contra el ambiente desplegado.
- Además del perfil administrador, cada módulo con permisos prueba al menos un perfil **sin** el permiso: el botón o la ruta no aparece y la
  navegación directa a la URL termina en la pantalla de acceso denegado.

## ⚠️ Reglas Críticas de Arquitectura en `el proyecto frontend`

Cualquier test de Playwright generado para este proyecto **DEBE** cumplir estas 4 reglas para no ser redirigido a `/auth/login`:

1. **Orden de `page.route` (Paraguas Anti-401 Primero):**
   - `authErrorInterceptor` (`src/app/core/interceptors/auth.interceptor.ts`) intercepta cualquier error `401` de `/api/**` y redirige inmediatamente el navegador a `/auth/login`.
   - Como el layout (`SystemTopbar`) lanza peticiones secundarias al cargar (notificaciones, restricciones, variables), **SIEMPRE se debe registrar primero un fallback general `**/api/**`** que devuelva `200 OK` con `{ responseCode: '200', data: [] }`, y **después** registrar los mocks específicos del módulo (Playwright evalúa los `page.route` en orden inverso: el último registrado tiene mayor prioridad).
2. **Mock obligatorio de OIDC Discovery (`initOidc`):**
   - Cuando hay un `access_token` en `sessionStorage`/`localStorage`, `initOidc()` (`src/app/core/auth/oidc.initializer.ts`) intenta descargar `**/.well-known/openid-configuration**`. Siempre debe mockearse para no depender de el proveedor de identidad.
3. **Mock obligatorio de `/api/usuarios/me` (`authGuard` y `menuGuard`):**
   - `menuGuard` verifica que la ruta actual (ej. `'/roles'`, `'/usuarios'`) esté incluida dentro del arreglo `data.menus` de `/api/usuarios/me`.
4. **Ubicación de pruebas E2E separada de Jasmine:**
   - Todos los tests de Playwright viven en `e2e/specs/<modulo>.spec.ts` y las especificaciones en `e2e/features/<modulo>/administracion_<modulo>.feature`.
   - Siempre ejecutar Playwright desde la raíz de `el proyecto frontend` pasando `--config=playwright.config.ts` para no mezclar con los `*.spec.ts` unitarios de Karma/Jasmine en `src/app/`.

---

## 🔄 El Ciclo de 4 Fases en Frontend

```text
[ Tabla de Reglas de Negocio ]
        ⬇️ (Fase 1: Mapeo de Reglas a Elementos UI y Validadores Angular)
[ Matriz de Comportamiento Visual y Eventos HTTP ]
        ⬇️ (Fase 2: Especificación Gherkin de UI)
[ e2e/features/<modulo>/administracion_<modulo>.feature ]
        ⬇️ (Fase 3: Test Funcional en Playwright con Mocks de Sesión y Red)
[ e2e/specs/<modulo>.spec.ts ]
        ⬇️ (Fase 4: Ejecución Red-Green-Refactor)
[ Ajuste en Componente Angular (.ts / .html) ]
```

---

### FASE 1: Mapeo de Reglas de Negocio a Comportamiento UI

Cuando el usuario proporcione una tabla de reglas de negocio para un módulo del frontend, el agente debe clasificar cada regla según su impacto en la interfaz:

- **Inmutabilidad / Solo Lectura:** Verificar que el input (`#codigoRegistro`, etc.) esté deshabilitado (`toBeDisabled()`) cuando el modal está en modo `'editar'`.
- **Campos Obligatorios, Longitudes y Saneamiento:** Verificar que al ingresar cadenas vacías o solo espacios (`"   "`), el formulario permanezca inválido (`noSoloEspacios`), se muestre `<app-error-input>` y el botón `"Guardar"` esté deshabilitado (`toBeDisabled()`).
- **Restricciones por Estado o Permiso:**
  - Si un registro está `inactivo`, verificar que las acciones secundarias (ej. asignar menús `pi-sitemap` o privilegios `pi-key`) estén deshabilitadas.
  - Si existe una restricción en `/api/v1/<modulo>-acciones/restricciones` (`UPDATE`, `DELETE`, `DEACTIVATE`), verificar que el botón o `<p-toggleSwitch>` correspondiente esté deshabilitado.
- **Confirmaciones y Advertencias (`<p-confirmDialog>`):** Verificar que antes de ejecutar un `DELETE` o inactivar un registro con relaciones activas, se despliegue `.p-confirmdialog` advirtiendo al usuario.
- **Filtros, Búsqueda y Paginación (`<p-table>`):** Verificar que el formulario de filtros envíe el payload a `/search`, que `"Limpiar filtros"` restaure la tabla original y que el paginador muestre los conteos esperados.

---

### FASE 2: Plantilla Base de Sesión y Mocks (`e2e/specs/<modulo>.spec.ts`)

Todo archivo `e2e/specs/<modulo>.spec.ts` debe incluir esta estructura base de configuración:

```typescript
async function configurarMocksBase(page: Page, rutaModulo: string) {
    // 1. Token OIDC simulado en storage
    await page.addInitScript(() => {
        const expira = String(Date.now() + 3600 * 1000);
        window.sessionStorage.setItem('access_token', 'fake-jwt-token-e2e');
        window.sessionStorage.setItem('expires_at', expira);
        window.localStorage.setItem('access_token', 'fake-jwt-token-e2e');
        window.localStorage.setItem('expires_at', expira);
    });

    // 2. Paraguas fallback para evitar 401 en llamadas secundarias (topbar, notificaciones, etc.)
    await page.route('**/api/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ responseCode: '200', responseMessage: 'OK', data: [], errorList: [] })
        });
    });

    // 3. Discovery OIDC simulado para initOidc()
    await page.route('**/.well-known/openid-configuration**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                issuer: 'http://localhost:9000/application/o/starter/',
                authorization_endpoint: 'http://localhost:9000/application/o/authorize/',
                token_endpoint: 'http://localhost:9000/application/o/token/',
                jwks_uri: 'http://localhost:9000/application/o/starter/jwks/'
            })
        });
    });

    // 4. Contexto de usuario con acceso a la ruta para pasar authGuard y menuGuard
    await page.route('**/api/usuarios/me**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                responseCode: '200',
                responseMessage: 'OK',
                data: {
                    usuarioId: '99999999-9999-9999-9999-999999999999',
                    sub: 'admin-e2e',
                    username: 'admin.e2e',
                    email: 'admin@ejemplo.local',
                    rolActivoId: '11111111-1111-1111-1111-111111111111',
                    rolesClaims: ['SUPER_ADMIN'],
                    roles: [{ id: '11111111-1111-1111-1111-111111111111', codigo: 'SUPER_ADMIN', nombre: 'Super Admin', activo: true, peso: 10 }],
                    menus: [{ id: 'm1', nombre: 'Módulo', ruta: rutaModulo }],
                    menusArbol: [],
                    permisos: ['ADMIN']
                },
                errorList: []
            })
        });
    });
}
```

---

### FASE 3: Comandos de Ejecución

Siempre ejecutar desde la raíz del proyecto frontend:
- **Modo Visual Interactivo (UI):** `npx playwright test --config=playwright.config.ts --ui`
- **Modo Consola (Headless):** `npx playwright test --config=playwright.config.ts`
- **Un módulo específico:** `npx playwright test e2e/specs/<modulo>.spec.ts --config=playwright.config.ts`

## Reglas del escáner que esta skill evita
`SMART-TESTS-ACCESS-CONTROL-FAILURE`, `SMART-TESTS-FORM-INVALID-SUBMITTED`, `SMART-TESTS-FORM-NO-FIELD-ERROR`, `RUNTIME-SERVER-ERRORS`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
