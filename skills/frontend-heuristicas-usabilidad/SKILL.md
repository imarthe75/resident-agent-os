---
name: frontend-heuristicas-usabilidad
description: Las 10 heurísticas de usabilidad de Nielsen y la teoría de carga cognitiva aplicadas a pantallas Angular 21 + PrimeNG 21 — estados de carga, prevención y recuperación de errores, confirmaciones, consistencia y accesibilidad — con su verificación en código y las reglas del escáner que las respaldan.
---

# Heurísticas de usabilidad en el frontend

Base: las 10 heurísticas de Jakob Nielsen (1994) y la teoría de carga cognitiva de John Sweller: la interfaz debe reducir el esfuerzo que no
aporta a la tarea. Se aplican al diseñar o revisar cualquier pantalla. Lo verificable en código tiene detector en el escáner de seguridad; el resto se
revisa en la prueba funcional y con usuarios.

| # | Heurística | Cómo se aplica en la plantilla base | Verificación |
|---|---|---|---|
| 1 | Visibilidad del estado del sistema | `[loading]` en tablas y botones; indicador global (`loading.interceptor`). El éxito se ve en el cambio de estado (el diálogo se cierra, la tabla muestra el registro); la plantilla base no usa aviso de éxito (`generacion-componentes-ts`). Excepción: un proceso largo en segundo plano avisa al terminar | Botón que guarda deshabilitado mientras la petición está en curso — `ANGULAR-SUBMIT-NO-BUSY-GUARD` |
| 2 | Relación con el mundo real | Vocabulario del usuario (trámite, expediente, folio), fechas `dd/MM/yyyy`, montos con formato local | Revisión funcional |
| 3 | Control y libertad del usuario | Botón Cancelar en diálogos, «Limpiar filtros», volver sin perder la lista | Prueba Playwright del flujo de cancelación |
| 4 | Consistencia y estándares | Componentes PrimeNG antes que HTML nativo; colores y severidades del tema (`theming-architecture`, `generacion-estilos`) | Sin clases PrimeFlex/Bootstrap; sin `alert()/confirm()` nativos — `NATIVE-BROWSER-DIALOG` |
| 5 | Prevención de errores | Validadores (`Validators.required`, `noSoloEspacios`, longitudes), botón Guardar deshabilitado con formulario inválido, confirmación antes de borrar o inactivar, archivos validados por tipo y tamaño antes de subir | `DESTRUCTIVE-ACTION-NO-CONFIRM`, `ANGULAR-SUBMIT-NO-BUSY-GUARD` |
| 6 | Reconocer mejor que recordar | Selectores con filtro (`p-select [filter]`), valores actuales visibles al editar, vista previa junto a los datos | Revisión funcional |
| 7 | Flexibilidad y eficiencia | Atajos para usuarios frecuentes, `autocomplete` correcto en formularios de datos personales, búsqueda con `debounceTime` | `WCAG-1.3.5-INPUT-NO-AUTOCOMPLETE`, `ANGULAR-VALUECHANGES-NO-DEBOUNCE` |
| 8 | Diseño estético y minimalista | Una acción principal por vista; solo las columnas necesarias; sin texto de relleno | Revisión funcional |
| 9 | Ayudar a reconocer, diagnosticar y recuperarse de errores | Mensaje por campo con `<app-error-input>` en lenguaje llano (qué falló y cómo corregirlo); el error del servidor se traduce, nunca se muestra la traza; el usuario no pierde lo capturado | El `GlobalExceptionHandler` no expone trazas (`STACK-TRACE-EXPOSURE`); errores HTTP manejados (`SWALLOWED-ERROR`) |
| 10 | Ayuda y documentación | `pTooltip` en botones de icono; texto de ayuda breve junto al campo complejo | Botones de icono con nombre accesible (`aria-label`/`pTooltip`) — reglas WCAG de nombre accesible |

## Carga cognitiva (Sweller)
- Formularios largos divididos en secciones o pasos, con los campos obligatorios primero.
- Una sola forma de hacer cada cosa en todo el sistema.
- Los mensajes dicen la acción siguiente («Seleccione una unidad administrativa»), no solo el problema.

## Accesibilidad (piso obligatorio, WCAG 2.1 AA)
La usabilidad incluye a usuarios con lector de pantalla o solo teclado: etiqueta asociada en cada control, texto alternativo, nombre
accesible en botones de icono, foco visible, `lang` en `<html>`, sin `tabindex` positivo, iframes con `title`. Detalle y plantillas en
`generacion-componentes-html`. Es requisito legal en proyectos de gobierno, no preferencia de diseño.

## Checklist de una pantalla nueva
- [ ] Carga visible; botones de guardado deshabilitados durante la petición.
- [ ] Borrar/inactivar pide confirmación con `p-confirmDialog` (no `confirm()` nativo).
- [ ] Validación por campo con mensaje claro; Guardar deshabilitado si el formulario es inválido.
- [ ] Cancelar y Limpiar disponibles; no se pierde lo capturado ante un error del servidor.
- [ ] Accesibilidad: etiquetas, nombres accesibles, foco, `autocomplete`.
- [ ] Sin `alert()`/`confirm()`/`prompt()` nativos.
