---
skill: generacion-componentes-ts
description: Guía canónica para generar, extender o modificar la lógica TypeScript de los componentes Angular, aplicando Clean Code y estándares "future-proof" (Angular 21).
---

# Spec: Generación de Componentes TypeScript (Lógica UI)

## Propósito

Este documento define las reglas estrictas de arquitectura, convenciones y patrones que la IA **debe seguir** al crear o modificar el archivo `.component.ts` de cualquier componente en el proyecto.

El proyecto se encuentra en **Angular 21**. Por lo tanto, el código generado hoy debe ser _future-proof_ adaptando las APIs modernas del framework.

---

## 1. Modo de operación

Preguntas obligatorias a resolver antes de generar/modificar:

| #   | Pregunta                                                                            | Uso                           |
| --- | ----------------------------------------------------------------------------------- | ----------------------------- |
| 1   | ¿Cuál es el nombre del componente? (ej.: `historial-digitalizacion`)                | Nomenclatura base             |
| 2   | ¿Se creará en una carpeta nueva o en una ruta existente?                            | Ubicación                     |
| 3   | ¿El componente recibe parámetros de entrada o emite eventos? (`@Input` / `@Output`) | Definir la API del componente |
| 4   | ¿Qué servicios va a consumir?                                                       | Inyección de dependencias     |

> **Nota:** La interacción con el HTML y el CSS se rige por su propia skill. Esta skill se centra únicamente en la clase TypeScript.

---

## 2. Nomenclatura y Estructura Base

### 2.1 Ubicación y Nombres

Todo componente nuevo o refactorizado debe pertenecer a un módulo dentro de `src/app/features/`. La estructura obligatoria de cada módulo sigue el paradigma **Feature-Based Simple Architecture** con separación estricta entre **Smart Components** (páginas) y **Dumb Components** (presentacionales):

```text
src/app/features/nombre-modulo/
├── pages/                          # Smart Components (nivel de ruta)
│   └── nombre-pagina/
│       ├── nombre-pagina.component.ts
│       ├── nombre-pagina.component.html
│       └── nombre-pagina.component.scss
├── components/                     # Dumb Components (presentacionales)
│   └── nombre-componente/
│       ├── nombre-componente.component.ts
│       ├── nombre-componente.component.html
│       └── nombre-componente.component.scss
├── services/                       # Fachada de datos (Feature Service)
│   └── nombre-servicio.service.ts
├── models/                         # Interfaces de tipado estricto (.model.ts)
│   └── nombre-modelo.model.ts
├── mappers/                        # Opcional. Convertidores de datos
│   └── nombre-entidad.mapper.ts
└── nombre-modulo.routes.ts         # Configuración de rutas internas (Lazy Loading)
```

> **Importante:** El infijo `.component.ts`, `.component.html` y `.component.scss` es **obligatorio** para los componentes. Las carpetas `services/` (plural), `models/` y `mappers/` son exclusivas y aisladas para cada módulo. Si se actualiza un módulo antiguo, se debe migrar a esta nueva estructura.

El selector debe llevar el prefijo `app-`:

```typescript
selector: "app-nombre-componente";
```

---

## 3. Arquitectura del Componente (Angular 21)

### 3.1 Standalone Components por Defecto

Angular 21 recomienda encarecidamente que los componentes no dependan de `NgModules`.
Todo nuevo componente generado **debe ser standalone**:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Obligatorio para directivas básicas
// + Imports de módulos de PrimeNG u otros componentes standalone que use el HTML

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [Component /* ... dependencias del template */],
  templateUrl: './mi-componente.component.html',
  styleUrls: ['./mi-componente.component.scss']
})
export class MiComponenteComponent { ... }
```

> **Regla de negocio (capitalización):** si el template incluye un campo **nombre** (`appMayusculas`) o **correo** (`appMinusculas`), importa la directiva correspondiente desde `@/app/core/directives/` en el array `imports`:
>
> ```typescript
> import { MayusculasDirective } from '@/app/core/directives/mayusculas.directive';
> import { MinusculasDirective } from '@/app/core/directives/minusculas.directive';
> // ...
> imports: [/* ... */, MayusculasDirective, MinusculasDirective],
> ```
>
> Ver la skill de HTML (§3.2.1) para el detalle de la regla.

### 3.3 API de Componentes: `input()` y `output()` (Signals)

**Prohibido** usar `@Input()` y `@Output()` con decoradores en componentes nuevos. Usar exclusivamente la API funcional de signals:

```typescript
import { Component, input, output } from '@angular/core';

@Component({ ... })
export class MiDumbComponent {
  // Inputs reactivos
  titulo = input<string>('Valor por defecto');
  elemento = input.required<EntidadInterface>();
  configuracion = input<ConfigType>();

  // Outputs funcionales
  onSelectionChange = output<string>();
  onDelete = output<number>();
  onSave = output<EntidadInterface>();

  emitirEvento(): void {
    this.onSelectionChange.emit('nuevo-valor');
  }
}
```

> **Regla:** Los Dumb Components en `components/` **solo** se comunican mediante `input()` y `output()`. No inyectan servicios, no hacen llamadas HTTP ni manejan estado de carga del servidor.

### 3.2 Inyección de Dependencias con `inject()`

**Extrictamente prohibido:** Inyectar servicios en el `constructor()` para los componentes nuevos.
**Obligatorio:** Usar la función `inject()` de `@angular/core` para declarar las dependencias como propiedades de la clase.

```typescript
// ❌ Incorrecto (Legacy)
constructor(private _ss: SolicitudDataService, private _ms: MensajesService) {}

// ✅ Correcto (Angular 21)
private readonly solicitudService = inject(SolicitudDataService);
private readonly mensajesService = inject(MensajesService);
```

> **Regla Smart/Dumb:** Solo los **Smart Components** (en `pages/`) inyectan servicios, manejan estado con signals y controlan la navegación. Los **Dumb Components** (en `components/`) **no deben inyectar servicios** — reciben datos mediante `input()` y notifican eventos con `output()`.

> _Motivo:_ El uso de `inject()` evita el temido "constructor hell" cuando se usa herencia (`super()`) y hace que la inicialización de variables reactivas sea mucho más declarativa.

---

## 3.4 Normalización de texto antes de enviar al servicio (Regla de Negocio)

_Obligatorio:_ Los valores de texto se normalizan **antes de invocar al servicio** (NO en vivo mientras se teclea — un trim por tecla impediría escribir espacios entre palabras). Se usan los helpers de `@/app/features/utils/form-utils`:

- **Filtros de búsqueda:** aplicar `normalizarValores(form.value)` (trim + `''`→`null`, sin mutar) para construir el payload que se envía.
- **Formularios de alta/edición:** aplicar `sanearFormulario(form)` (muta los controles con trim + `''`→`null` y revalida) antes de checar validez. Así, si un campo obligatorio quedó en `null` tras el trim, `Validators.required` lo atrapa.
- **Validación en vivo:** los campos de texto obligatorios deben declararse con `noSoloEspacios` junto a `Validators.required`, para que un valor con solo espacios marque el form inválido (botón deshabilitado) sin esperar al submit.

```typescript
import { noSoloEspacios, normalizarValores, sanearFormulario } from '@/app/features/utils/form-utils';

// Definición del form de alta/edición
this.formGuardar = this.fb.group({
  nombre: [null, [Validators.required, noSoloEspacios, Validators.maxLength(100)]],
  correo: [null, [Validators.required, noSoloEspacios, Validators.email]],
});

// Filtros: normalizar antes de enviar
buscarDatos(): void {
  const filtros = normalizarValores(this.formBuscar.value);
  this.servicio.buscar(filtros).subscribe(/* ... */);
}

// Alta/Edición: sanear, revalidar y solo enviar si es válido
guardar(): void {
  sanearFormulario(this.formGuardar);
  if (this.formGuardar.invalid) {
    this.formGuardar.markAllAsTouched();
    return;
  }
  const payload = this.formGuardar.getRawValue();
  this.servicio.guardar(payload).subscribe(/* ... */);
}
```

---

## 4. Manejo de Suscripciones: `takeUntilDestroyed()`

El manejo incorrecto de suscripciones causa fugas de memoria críticas. A partir de Angular 20, **ya no es necesario** crear manualmente un `Subject`, ni implementar `ngOnDestroy()` con `.next() / .complete()`.

**Regla estricta:** Toda suscripción a un `Observable` que no finalice inmediatamente (como una petición HTTP o escuchar un evento del usuario) **debe** llevar `.pipe(takeUntilDestroyed())`.

```typescript
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DestroyRef, inject } from "@angular/core";

export class MiComponenteComponent {
  private readonly solicitudService = inject(SolicitudDataService);
  private readonly mensajesService = inject(MensajesService);

  // Si nos suscribimos fuera del constructor (ej. en ngOnInit),
  // debemos inyectar el DestroyRef para pasarlo al operador.
  private readonly destroyRef = inject(DestroyRef);

  cargarDatos(): void {
    this.solicitudService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef)) // ⬅️ PATRÓN OBLIGATORIO
      .subscribe({
        next: (res) => {
          this.listaDatos = res.data;
        },
        error: (errorDetail: ErrorDetail[]) => {
          errorDetail.forEach((err) =>
            this.mensajesService.showError(err.errorMessage),
          );
        },
      });
  }
}
```

> **Nota importante:** Si la suscripción se hace **directamente en el `constructor()`**, no es necesario inyectar ni pasar `destroyRef` al operador `takeUntilDestroyed()`. Angular lo infiere. Para métodos llamados en `ngOnInit()`, es indispensable pasar el `this.destroyRef`.

---

## 5. Ciclo de Vida del Componente

1. **`ngOnInit()`:** Único lugar para lógica de inicialización. Implementar siempre la interfaz `OnInit`. No llamar peticiones en el constructor.
2. **`ngOnChanges()`:** Se debe usar **únicamente** cuando la lógica de renderizado depende de que cambien los `@Input()`.
3. **`ngAfterViewInit()`:** Usarse **solo** si es estrictamente necesario interactuar con el DOM directamente o si se depende de `@ViewChild` inicializados. **Prohibido** modificar variables estáticas (datos vinculados al template) aquí dentro sin `setTimeout` (causaría `ExpressionChangedAfterItHasBeenCheckedError`).
4. **`ngOnDestroy()`:** Con el uso de `takeUntilDestroyed()`, rara vez se necesita. Solo implementar si hay limpiezas nativas de JS (ej.: `clearInterval`, listeners nativos del DOM).

---

## 6. Manejo de Errores desde Servicios

Los errores HTTP se capturan directamente en el callback `error:` del `subscribe()`. **Solo los Smart Components** (en `pages/`) se suscriben a servicios. Los Dumb Components nunca manejan errores HTTP.

El `errorInterceptor` global captura todos los errores HTTP automáticamente y muestra toasts de notificación. En el Smart Component solo se maneja la lógica de estado local:

```typescript
// En el Smart Component (pages/) — No se necesita MessageService
this.miServicio.operacion(payload).subscribe({
  next: (response: ResponseDto<ListaInterface>) => {
    // ✅ Actualizar el estado local con la respuesta completa
    this.lista.set(response.data);
    this.loading.set(false);
  },
  error: () => {
    // ✅ El errorInterceptor ya mostró el toast automáticamente
    // Solo actualizar estado local
    this.loading.set(false);
  }
});
```

> **Regla de Oro de mensajes:**
> - ❌ `severity: 'success'` — **Nunca**. El éxito se refleja en el cambio de estado de la UI.
> - ❌ `severity: 'error'` en el componente — **No**. El `errorInterceptor` global lo maneja.
> - ✅ Solo actualizar estado local en el callback `error:` del componente.

---

## 7. Ejemplos Completos Generados

### 7.1 Smart Component (en `features/nombre-modulo/pages/`)

```typescript
import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { TramiteService } from '../../services/tramite.service';
import { ResponseDto } from '@/app/core/models/response-dto.model';
import { TramiteModel } from '../../models/tramite.model';
import { TramiteCardComponent } from '../../components/tramite-card/tramite-card.component';

@Component({
  selector: 'app-tramite-list-page',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TramiteCardComponent],
  templateUrl: './tramite-list-page.component.html',
  styleUrl: './tramite-list-page.component.scss',
})
export class TramiteListPageComponent implements OnInit {
  // Dependencias (solo Smart Components inyectan servicios)
  private readonly tramiteService = inject(TramiteService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Estado del componente (Signals)
  tramites = signal<TramiteModel[]>([]);
  loading = signal<boolean>(false);
  totalRecords = signal<number>(0);

  ngOnInit(): void {
    this.cargarTramites();
  }

  cargarTramites(): void {
    this.loading.set(true);

    this.tramiteService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ResponseDto<TramiteModel[]>) => {
          // ✅ Recibe ResponseDto<T> completo
          this.tramites.set(response.data);
          this.totalRecords.set(response.data.length);
          this.loading.set(false);
        },
        error: () => {
          // ✅ El errorInterceptor global ya mostró el toast
          this.loading.set(false);
        },
      });
  }

  verDetalle(id: string): void {
    this.router.navigate(['/tramites', id]);
  }
}
```

### 7.2 Dumb Component (en `features/nombre-modulo/components/`)

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

import { TramiteModel } from '../../models/tramite.model';

@Component({
  selector: 'app-tramite-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './tramite-card.component.html',
  styleUrl: './tramite-card.component.scss',
})
export class TramiteCardComponent {
  // Inputs reactivos (Signal inputs)
  tramite = input.required<TramiteModel>();
  modoLectura = input<boolean>(false);

  // Outputs funcionales (Signal outputs)
  onSelect = output<string>();
  onDelete = output<string>();

  seleccionar(): void {
    this.onSelect.emit(this.tramite().id);
  }

  eliminar(): void {
    this.onDelete.emit(this.tramite().id);
  }
}
```

---

## 8. Checklist de Validación antes de entregar

Al finalizar la creación o modificación de un componente `.ts`, la IA debe validar lo siguiente:

- [ ] ¿El componente es `standalone: true` e importa solo los módulos necesarios?
- [ ] ¿Las inyecciones de dependencias usan `inject()` en lugar de constructor?
- [ ] ¿Toda suscripción `subscribe()` va precedida de `.pipe(takeUntilDestroyed(this.destroyRef))`?
- [ ] ¿Los errores HTTP **no** muestran toast manualmente? (el `errorInterceptor` global lo hace)
- [ ] ¿La clase implementa explícitamente `OnInit` si cuenta con `ngOnInit()`?
- [ ] ¿Usa `input()` / `input.required()` en lugar de `@Input()`?
- [ ] ¿Usa `output()` en lugar de `@Output()` y `EventEmitter`?
- [ ] ¿Los filtros usan `normalizarValores()` y las altas/ediciones `sanearFormulario()` antes de enviar al servicio? ¿Los campos de texto obligatorios incluyen `noSoloEspacios`? (Regla de normalización de texto §3.4)
- [ ] ¿Los nombres de las carpetas están en `kebab-case` y los archivos usan el infijo `.component.ts / .html / .scss`?
- [ ] ¿Se respetó la estructura feature-based (`pages/` o `components/`, `services/`, `models/`)?
- [ ] **Si es Smart Component (pages/):** ¿Inyecta servicios, maneja signals y navegación?
- [ ] **Si es Dumb Component (components/):** ¿Usa solo `input()`/`output()`, sin inyectar servicios ni hacer HTTP?

---

## 9. Referencias Cruzadas

- Para la generación de los servicios consumidos, ver [Generacion Servicios](../generacion-servicios/SKILL.md)
- Para el tipado de los modelos, ver [Generacion DTOs](../generacion-dtos/SKILL.md)
