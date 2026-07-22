# Skill 2: Modernización de Componentes Angular

Este Skill define las reglas obligatorias para transformar componentes heredados o desordenados de Angular en piezas de código modernas, eficientes y alineadas al estándar actual (Angular 18+).

---

## 🎯 Objetivo General
Eliminar las dependencias de `NgModules` heredados, migrar todos los componentes a **Standalone**, implementar reactividad precisa mediante **Angular Signals** en lugar de variables ordinarias o Subjects de RxJS, y aplicar tipados estrictos prohibiendo el uso del tipo `any`.

---

## 1. Migración Estricta a Standalone Components
Todo componente, directiva o pipe migrado debe ser configurado explícitamente como Standalone:

* **Configuración del Decorador**:
  Establece `standalone: true` en el decorador `@Component`.
* **Imports Explícitos**:
  Elimina la dependencia de módulos externos compartidos gigantescos. Declara de forma explícita únicamente las directivas y componentes que requiere la plantilla HTML en el arreglo `imports` de la clase:
  ```typescript
  @Component({
      selector: 'app-client-list',
      standalone: true,
      imports: [
          CommonModule,
          FormsModule,
          TableModule,     // Componente PrimeNG requerido
          ButtonModule     // Componente PrimeNG requerido
      ],
      templateUrl: './client-list.component.html',
      styleUrl: './client-list.component.scss' // styleUrl en singular
  })
  ```
* **Aislamiento de Plantillas**:
  Se prohíbe el uso de plantillas HTML o estilos SCSS en línea (*inline*) para componentes reales de negocio. Todos los componentes de características deben separar su código en archivos `.ts`, `.html` y `.scss`.
  *(Excepción: Componentes utilitarios extremadamente pequeños de menos de 15 líneas de HTML)*.

---

## 2. Implementación de Reactividad Basada en Signals
Sustituye el ciclo tradicional de detección de cambios y los flujos complejos de RxJS en componentes por **Angular Signals**:

* **Component State**:
  Declara el estado del componente mediante funciones `signal()`:
  ```typescript
  // ANTES
  // public clients: ClientResponse[] = [];
  // public loading: boolean = false;

  // AHORA
  public clients = signal<ClientResponse[]>([]);
  public loading = signal<boolean>(false);
  ```
* **Lectura en Plantilla**:
  Recuerda llamar a la función del signal en las plantillas HTML para suscribirte reactivamente al valor:
  ```html
  <p-table [value]="clients()" [loading]="loading()"></p-table>
  ```
* **Mutaciones de Estado**:
  Actualiza los valores del estado utilizando los métodos `.set()` o `.update()`:
  ```typescript
  this.loading.set(true);
  this.clients.set(response.data);
  ```
* **Inputs y Outputs de Nueva Generación**:
  Declara las propiedades de entrada de datos utilizando la API de signals `input()` o `input.required()` en lugar de `@Input()`:
  ```typescript
  // ANTES: @Input() clientId!: string;
  // AHORA:
  clientId = input.required<string>();
  ```
* **Propiedades Derivadas (`computed`)**:
  Utiliza señales computadas para cálculos o filtros automáticos en base a otras señales:
  ```typescript
  totalClients = computed(() => this.clients().length);
  ```

---

## 3. Inyección Funcional de Dependencias (`inject`)
Erradica la inyección de dependencias mediante parámetros en el constructor e implementa la inyección funcional con `inject()`:

```typescript
// ANTES (Prohibido)
// constructor(private clientService: ClientService, private router: Router) {}

// AHORA (Correcto y Obligatorio)
private readonly clientService = inject(ClientService);
private readonly router = inject(Router);
```

Beneficios obligatorios de este enfoque:
* Clases más legibles y limpias.
* Se elimina la necesidad de declarar constructores vacíos únicamente para inyectar dependencias.
* Facilidad extrema para realizar pruebas unitarias e inyectar mocks.

---

## 4. Tipado Estricto (Prohibición de `any`)
El uso de `any` queda terminantemente prohibido durante el proceso de refactorización:

* **Contratos de Datos**:
  Declara interfaces de TypeScript explícitas para cada petición HTTP (`Request`) y cada respuesta (`Response`) en la carpeta `models/` de la feature.
* **Fallback a `unknown`**:
  Si el tipo de un dato es verdaderamente impredecible en tiempo de compilación, debes tiparlo como `unknown` y aplicar estrechamiento de tipos (*type narrowing*) mediante condicionales `typeof` o validadores de interfaz antes de manipular el dato.
* **Retornos de Funciones**:
  Todas las firmas de métodos y funciones en servicios y componentes deben declarar explícitamente su tipo de retorno (ej. `Observable<ApiResponse<ClientResponse>>`, `void`, `boolean`).
