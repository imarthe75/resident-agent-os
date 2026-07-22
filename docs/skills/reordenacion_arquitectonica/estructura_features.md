# Arquitectura de Características (Feature-Based Architecture)

Este documento detalla la estructura modular de las características (**`features/`**) en el frontend, la distinción clave entre componentes inteligentes (**Smart Components**) y presentacionales (**Dumb Components**), y el flujo de datos unidireccional recomendado.

La estructura de carpetas de **`features/`** (módulos de negocio) es el corazón del paradigma de **Feature-Based Simple Architecture**. Este enfoque organiza el código de manera **vertical**, lo que significa que cada módulo de negocio es autocontenido, independiente y agrupa toda su lógica en una única ubicación en lugar de dispersarla por el proyecto.

---

## 📂 1. Anatomía de una Feature

Tomando como ejemplo el módulo de **Propiedades (`properties/`)**, su árbol de directorios se estructura de la siguiente manera:

```txt
src/app/features/properties/
├── pages/                  # Componentes de nivel de ruta (Smart Components)
│   ├── property-list/      # Listado de propiedades
│   ├── property-detail/    # Detalle de una propiedad
│   └── property-form/      # Formulario de creación y edición (Single Form Pattern)
│
├── components/             # Widgets internos reutilizables (Dumb Components)
│   ├── property-card/
│   ├── property-filters/
│   └── property-status-badge/
│
├── services/               # Fachada de datos (Feature Service)
│   └── property.service.ts
│
├── models/                 # Interfaces de tipado estricto (Mirror de los DTOs)
│   ├── property-response.model.ts
│   ├── create-property-request.model.ts
│   └── property-search-request.model.ts
│
├── mappers/                # (Opcional) Convertidores de datos
│   └── property.mapper.ts
│
└── properties.routes.ts    # Configuración de rutas internas (Lazy Loading)
```

---

## 🛠️ 2. Responsabilidad de cada Directorio

### 2.1 `pages/` (Smart Components / Nivel de Ruta)
Son los componentes que se asocian directamente con las rutas en Angular. Actúan como los orquestadores o directores de la vista.
* **Qué hacen**: Inyectan los servicios de la característica, administran el estado reactivo principal mediante Signals (`signal<T>()`), se suscriben a los flujos de datos y manejan la navegación visual.
* **Regla**: No realizan llamadas HTTP directamente ni manipulan el DOM de forma imperativa. Delegan la carga pesada visual a los componentes de `components/`.

### 2.2 `components/` (Dumb Components / Presentacionales)
Son los widgets reutilizables que solo existen y tienen sentido dentro de esta característica.
* **Qué hacen**: Reciben datos a través de entradas reactivas (`input()`) y notifican interacciones o eventos al exterior mediante salidas (`output()`).
* **Regla**: **No deben inyectar servicios ni realizar llamadas HTTP**. Si un componente de este tipo necesita reutilizarse en *múltiples* módulos de negocio (por ejemplo, un buscador genérico), no pertenece aquí, sino a `src/app/shared/components/`.

### 2.3 `services/` (Fachada / Facade Pattern)
Es el único intermediario entre los componentes del módulo y el backend.
* **Qué hace**: Centraliza todas las llamadas HTTP de la característica. Inyecta el `ApiService` del core y consume las constantes de endpoints configuradas en `API_ENDPOINTS`. Devuelve Observables fuertemente tipados a los componentes de página.
* **Regla**: **No maneja lógica de interfaz de usuario** (no muestra mensajes Toast, alertas ni manipula HTML). Su única responsabilidad es transferir y recibir datos.

### 2.4 `models/` (Tipado Estricto)
Colección de interfaces y tipos TypeScript que representan de forma exacta las estructuras de datos que viajan desde y hacia el servidor.
* **Qué hace**: Asegura que el compilador y los desarrolladores conozcan la forma exacta de los payloads.
* **Reglas**:
  * **Cero `any`**: Está terminantemente prohibido.
  * Separación estricta entre modelos de petición (`Request`) y modelos de respuesta (`Response`).

### 2.5 `mappers/` (Opcional)
Se utiliza únicamente si es necesario transformar las estructuras del servidor antes de presentarlas, o viceversa.
* **Qué hace**: Transforma cadenas de fecha ISO en objetos `Date` de JavaScript, convierte números crudos en etiquetas localizadas, o adapta el valor de un formulario reactivo al DTO de request esperado por la API.

### 2.6 `properties.routes.ts` (Enrutamiento Modular)
Define la tabla de navegación de esta característica en particular.
* **Qué hace**: Asocia las sub-rutas internas con sus respectivos componentes en la carpeta `pages/` (ej: `/properties`, `/properties/new`, `/properties/:id`).
* **Beneficio**: Permite que el archivo global `app.routes.ts` cargue todo el módulo de manera perezosa (**Lazy Loading**) únicamente cuando el usuario navega a esa sección del CRM, reduciendo drásticamente el tamaño inicial de carga de la web.

---

## 3. Diferencia Detallada: Smart Components vs Dumb Components

Cuando nos referimos a **"Componentes de nivel de ruta (Smart Components)"**, estamos combinando dos conceptos de diseño fundamentales: **dónde existe** el componente en la navegación y **cuál es su responsabilidad** lógica.

### 3.1 Nivel de Ruta (Route-Level) vs Componentes Anidados
* **Nivel de Ruta**: Es un componente mapeado directamente a una dirección URL en el enrutador de Angular. Representa una pantalla completa (ej. `PropertyListComponent` para `/properties`).
* **Componente Anidado**: Un componente secundario que se renderiza dentro de otro (ej. `<app-property-card>` en bucles del listado). No posee URL propia.

### 3.2 Responsabilidad Lógica: Smart vs Dumb
* **Smart Component (Inteligente)**: Conoce las reglas del sistema, el estado y el flujo de datos. Inyecta servicios, lee parámetros de la ruta (ID del elemento actual), almacena Signals y coordina la navegación.
* **Dumb Component (Tonto/Presentacional)**: Es completamente agnóstico del backend. Su único objetivo es pintar el HTML bonito y emitir eventos cuando el usuario interactúa. Recibe datos con `input()` y los envía con `output()`.

---

## 🔍 4. Comparativa de Código Práctico

### A) El Smart Component: `property-list.component.ts` (en `pages/`)
*Está conectado a la URL `/properties`, obtiene datos del servidor y maneja el estado de carga.*

```typescript
@Component({
  selector: 'app-property-list-page',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent, ProgressSpinnerModule],
  template: `
    <h1>Catálogo de Propiedades</h1>
    
    <!-- Muestra spinner si está cargando (Estado inteligente) -->
    @if (loading()) {
      <p-progressSpinner></p-progressSpinner>
    } @else {
      <div class="grid grid-cols-12 gap-4">
        <!-- Renderiza los widgets pasándole datos mediante inputs -->
        @for (prop of properties(); track prop.id) {
          <app-property-card 
            class="col-span-4" 
            [property]="prop"
            (onSelect)="viewDetails($event)">
          </app-property-card>
        }
      </div>
    }
  `
})
export class PropertyListPageComponent implements OnInit {
  private readonly propertyService = inject(PropertyService); // Inyecta servicio HTTP
  private readonly router = inject(Router);

  // Señales de Estado
  properties = signal<PropertyResponse[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.propertyService.getProperties().subscribe(res => {
      this.properties.set(res.data);
      this.loading.set(false);
    });
  }

  viewDetails(id: string) {
    this.router.navigate(['/properties', id]); // Maneja navegación
  }
}
```

### B) El Dumb Component: `property-card.component.ts` (en `components/`)
*No tiene URL, no hace peticiones HTTP ni maneja el estado del servidor. Solo recibe datos del Smart Component y pinta el HTML con Tailwind.*

```typescript
@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <p-card [header]="property().title">
      <p class="text-gray-600">{{ property().price | currency }}</p>
      <p-button label="Ver más" (onClick)="selectProperty()"></p-button>
    </p-card>
  `
})
export class PropertyCardComponent {
  // Recibe los datos de forma reactiva (Signal Input)
  property = input.required<PropertyResponse>();
  
  // Emite un evento hacia el Smart Component cuando hacen clic
  onSelect = output<string>();

  selectProperty() {
    this.onSelect.emit(this.property().id);
  }
}
```

---

## 🔄 5. Flujo de Trabajo y Comunicación de Datos

El flujo de información respeta una dirección estrictamente unidireccional y desacoplada:

```mermaid
graph TD
    subgraph Módulo de Negocio (Feature)
        Page[pages/ Smart Component] -->|1. Consume / Invoca| Service[services/ Feature Service]
        Dumb[components/ Dumb Component] -->|2. Emite eventos con @Output| Page
        Page -->|3. Envía datos con @Input| Dumb
        Service -->|4. Expone Observables tipados| Page
    end
    
    subgraph Core de la Aplicación
        Service -->|5. Llama a través de API_ENDPOINTS| Api[core/ApiService]
    end
    
    subgraph Servidor (Backend)
        Api -->|6. Petición Segura interceptada| BE[API REST]
    end
```
