# Skill 1: Mapeo y Migración de Archivos

Este Skill instruye al agente de IA sobre cómo escanear un proyecto de Angular desordenado y reorganizarlo bajo un esquema estrictamente **Feature-Based (Basado en Características)**.

---

## 🎯 Objetivo General
Identificar todos los componentes, servicios, modelos y utilidades dispersos en el proyecto antiguo y agruparlos en módulos verticales autocontenidos en `src/app/features/`, aislando la infraestructura global en `src/app/core/` y las utilidades agnósticas en `src/app/shared/`.

---

## 1. Escaneo e Inventario Inicial
Antes de realizar cualquier movimiento de archivos, debes escanear la base de código actual e identificar los siguientes elementos para construir un **Inventario de Componentes y Servicios**:

* **Componentes de Nivel de Ruta (Smart Components)**: Aquellos que cargan vistas completas (ej. listas de registros, páginas de detalle, formularios completos de creación/edición).
* **Componentes Presentacionales (Dumb Components)**: Tablas reutilizables, badges de estado, filtros modulares, modales o diálogos específicos de un dominio de negocio.
* **Componentes Compartidos (Shared)**: Spinners globales, pies de página, barras de navegación agnósticas, inputs estilizados reutilizables en múltiples vistas.
* **Servicios de Negocio**: Servicios que interactúan con endpoints específicos (ej. `ClientService`, `PropertyService`, `BillingService`).
* **Servicios de Infraestructura**: Gestión de tokens, cookies, localStorage, carga/loading global, modales de confirmación transversales.

---

## 2. Definición del Destino de Archivos

Debes reubicar los archivos del proyecto antiguo siguiendo estrictamente este mapa de destino:

### A. Ubicación de Infraestructura Transversal (`src/app/core/`)
Cualquier archivo de uso global o configuración transversal del sistema se mueve aquí:
* **`core/services/`**: `ApiService` (único wrapper de `HttpClient`), `TokenStorageService` (lectura de storage/JWT), `LoadingService` (spinner global).
* **`core/guards/`**: `authGuard`, `publicGuard`, `permissionGuard`.
* **`core/interceptors/`**: Interceptores de autenticación (JWT), spinners e interceptores de errores.
* **`core/constants/`**: `APP_ROUTES` (rutas frontend), `API_ENDPOINTS` (endpoints de backend), `STORAGE_KEYS` (llaves de localStorage).
* **`core/models/`**: Estructuras globales como `ApiResponse<T>` o `PagedResponse<T>`.

### B. Ubicación de Módulos de Negocio (`src/app/features/`)
Todo componente o servicio que dependa de una lógica de negocio específica debe agruparse en su respectivo subdirectorio vertical:

```txt
src/app/features/[nombre-del-modulo]/
├── pages/          # Smart Components (controladores de página de nivel de ruta)
├── components/     # Dumb Components (widgets y componentes presentacionales internos)
├── services/       # Fachada del módulo (FeatureService) que interactúa con core/ApiService
├── models/         # Interfaces e intercambios de datos estrictamente tipados
├── mappers/        # Opcional. Convertidores de datos/fechas
└── [nombre-del-modulo].routes.ts   # Definición de rutas del módulo (para Lazy Loading)
```

### C. Ubicación de Componentes Compartidos (`src/app/shared/`)
Elementos 100% reutilizables y **completamente agnósticos del negocio**:
* Componentes visuales genéricos (ej. `notfound-page`, `confirm-dialog-wrapper`).
* Directivas globales estructurales o de atributos (ej. `*appHasPermission`, `numbersOnlyDirective`).
* Pipes puros de formateo (ej. `localCurrency`, `dateFormat`).
* Validadores personalizados de formularios reactivos.

---

## 3. Algoritmo de Ejecución para el Agente

Sigue este algoritmo paso a paso para evitar romper dependencias físicas:

1. **Genera la Tabla de Equivalencias**:
   Crea un reporte detallado en Markdown donde indiques qué archivos actuales se moverán y cuál será su ruta de destino exacta. Espera la confirmación del usuario.
2. **Crea la Nueva Estructura de Directorios**:
   Crea físicamente las carpetas `core/`, `shared/` y los subdirectorios de cada módulo identificado en `features/`.
3. **Migración Fisiológica de Servicios Core**:
   Implementa o mueve primero la infraestructura global de llamadas HTTP (`ApiService`) y almacenamiento de sesión (`TokenStorageService`), ya que todos los módulos de negocio dependerán de estos dos elementos.
4. **Migración Vertical Módulo por Módulo**:
   Mueve los archivos de un módulo de negocio a la vez. No mezcles componentes de múltiples características durante una misma fase de edición.
5. **Corrección de Imports Relativos (`path mapping`)**:
   Tras mover físicamente un componente o servicio, actualiza de inmediato todas sus sentencias `import`.
   * **Recomendación**: Utiliza alias de TypeScript configurados en `tsconfig.json` para simplificar las importaciones del Core y Shared (ej. `@/core/services/...` o `@/shared/components/...`).
6. **Eliminación y Depuración**:
   Una vez que el módulo compile bajo la nueva estructura, elimina los archivos huérfanos del directorio desordenado original.
