---
name: secure-forensic-audit-ui
description: "Directivas para la interfaz de consulta de auditoría y evidencia forense en Angular 21, PrimeNG 21 y Tailwind CSS: estado con signals, filtros, verificación de integridad de la cadena y exportación. Úsala junto con secure-forensic-audit cuando haya que construir o revisar la pantalla que muestra la bitácora forense."
---

# Skill: Interfaz de Usuario para Auditoría y Evidencia Forense (AI Agent Skill)

Este skill define las directrices y reglas obligatorias para que un Agente de IA diseñe e implemente el subsistema de **Interfaz de Auditoría y Evidencia Forense** en el frontend (Angular 21 + PrimeNG 21), garantizando una experiencia de usuario premium, reactividad avanzada y visualización segura de metadatos criptográficos.

## 1. Directrices de Arquitectura UI (Angular 21 & Reactividad)
*   **Declaratividad con Signals**: Toda la gestión de estado de la vista debe basarse estrictamente en Angular Signals (`signal`, `computed`). Queda prohibido el uso innecesario de `BehaviorSubject` o suscripciones manuales (`subscribe`) en el componente para renderizar datos.
*   **Consumo Reactivo de APIs (`toSignal`)**: Las colecciones estáticas y catálogos (módulos, acciones) deben consumirse y transformarse a Signals usando `toSignal` desde RxJS Observables provenientes de los servicios:
    ```typescript
    modulos = toSignal(this.auditoriaService.getModulos(), { initialValue: [] });
    ```
*   **Paginación Lazy Loading Mandatoria**: Para evitar la degradación de rendimiento y prevenir el colapso del navegador ante volúmenes masivos de datos (logs de auditoría), el componente de tabla de PrimeNG `p-table` debe utilizar la carga diferida (`[lazy]="true"`), controlando el ciclo completo en el evento `(onLazyLoad)="onLazyLoad($event)"`.

## 2. Directivas de Diseño Visual Premium (Estética y Colores Coherentes)
*   **Paleta y Acentuación Coherente**: La interfaz debe alinearse con la identidad visual corporativa de la plataforma. La paleta de colores (botones de acción, badges, acentos de integridad) debe seguir los tokens del sistema para un look integrado y premium.
*   **Micro-animaciones y Transiciones**: Cada cambio de vista, carga de datos o apertura de diálogos debe incorporar transiciones suaves (ej: `animate-in fade-in duration-500` mediante CSS/Tailwind) para una sensación moderna y fluida.
*   **Densidad de Información Optimizada**: Al ser una consola de administración y auditoría forense, se debe usar una densidad compacta (`size="small"`) para que el administrador pueda visualizar la mayor cantidad de metadatos sin scroll excesivo.

## 3. Directivas de Componentes PrimeNG 21 y UX
*   **Filtros Reactivos Inteligentes**:
    *   **Rango de Fechas**: Controlado por `p-datepicker` con validación cruzada reactiva (la fecha de fin no puede ser anterior a la de inicio).
    *   **Selectores Compactos**: Uso de `p-select` dinámicos con filtrado interno habilitado para listas largas de acciones de auditoría.
    *   **Componentes Fluidos**: Envoltura en `<p-fluid>` para asegurar adaptabilidad responsiva automática en rejillas móviles y de escritorio.
*   **Visor Forense (JSON Formatted)**:
    *   La evidencia cruda de metadatos debe desplegarse en un diálogo modal (`p-dialog`) premium.
    *   El payload debe visualizarse usando una etiqueta `<pre>` formateada con sintaxis JSON de alto contraste (fondo oscuro, texto verde esmeralda y fuente monoespaciada) garantizando legibilidad perfecta para ingenieros de soporte y auditores.
    *   El diálogo debe incluir controles de copiado rápido al portapapeles y cierre seguro con des-referenciación del estado en memoria.

## 4. Resiliencia de UI y Manejo de Errores
*   **Estados de Carga Integrados**: Uso del spinner nativo de PrimeNG en la tabla (`[loading]="loading()"`) sincronizado mediante el operador `finalize` en el stream HTTP, impidiendo que el usuario interactúe con controles en estados transicionales.
*   **Mensaje de Tabla Vacía Estilizado**: Siempre se debe proveer un template personalizado para `emptymessage` que contenga un ícono descriptivo y una explicación amigable en caso de que los filtros no arrojen resultados, evitando tablas vacías estériles.
*   **Prevención de Fugas de Memoria**: Limpiar de forma estricta las referencias de datos seleccionados al cerrar el modal forense y no suscribirse manualmente a observables infinitos en el constructor.

## Reglas del escáner que esta skill evita
`AUDIT-LOG-MUTATION-ENDPOINT`, `ANGULAR-BYPASS-SECURITY-TRUST`, `FRONTEND-TOKEN-IN-CONSOLE`, `WCAG-1.3.1-FORM-CONTROL-NO-LABEL`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
