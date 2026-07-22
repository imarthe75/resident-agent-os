# Skill: PrimeNG 21 Specialist

## Purpose
Expertise en PrimeNG 21, Angular 21 moderno (standalone, Signals) y localización en Español de México.

## Knowledge Sources
- Core Reference: https://primeng.org
- Component API: https://primeng.org
- LLMs Reference: https://primeng.org/llms/

## Stack de referencia
- Angular 21 (standalone components — NO `NgModule`, NO `AppModule`)
- PrimeNG 21
- TailwindCSS 4 + `tailwindcss-primeui` (los tokens de Tailwind están alineados con los design tokens de PrimeNG)

## Standards & Best Practices

### Angular 21
- Usa exclusivamente **Signals** (`signal()`, `computed()`, `effect()`) para estado local y derivado.
- Usa `inject()` para inyección de dependencias. No uses el constructor para inyectar servicios.
- Usa la nueva sintaxis de control de flujo: `@if`, `@for`, `@switch`. No uses `*ngIf`, `*ngFor`.
- Todos los componentes son **standalone**. No importes `CommonModule` ni `BrowserModule`.
- Los formularios reactivos se declaran con `FormBuilder` inyectado vía `inject()`.

### PrimeNG 21
- Importa solo los componentes que uses (tree-shaking): `import { ButtonModule } from 'primeng/button'`.
- Prioriza el sistema **PassThrough (PT)** para personalización de estilos sobre CSS global.
- Usa `p-fluid` para que los inputs llenen el ancho de su contenedor.
- Para tablas: usa `[stripedRows]="true"` y carga lazy cuando el dataset supere ~100 registros.

### TailwindCSS + PrimeNG
- El paquete `tailwindcss-primeui` expone las variables CSS de PrimeNG como utilidades de Tailwind (ej. `bg-primary`, `text-primary-contrast`). Úsalas en lugar de colores hardcodeados.
- No dupliques estilos: si PrimeNG ya tiene un token para algo, no agregues una clase Tailwind manual encima.

### Localization
- Todos los labels, placeholders y mensajes de error en **Español de México**.
- Usar: "Aceptar", "Cancelar", "Guardar", "Eliminar", "Buscar", "Correo electrónico", "Contraseña".
- Evitar: "Ok", "Submit", "Delete", "Email", "Password".

### Tipado
- Define interfaces para todos los modelos de datos. No uses `any`.

## Workflow
1. Antes de generar un componente, verifica en `llms-full.txt` si hubo cambios en los `@Input`s de la v21.
2. Asegúrate de que el componente sea accesible (A11y) usando los atributos `aria-*` sugeridos en la doc.
3. Si el componente requiere un tema o color institucional, consulta la skill de Theming antes de proceder.
