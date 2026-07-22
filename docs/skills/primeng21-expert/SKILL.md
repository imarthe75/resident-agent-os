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

## 6. Análisis de Tarea y Carga de Skills

Dependiendo de lo que el usuario solicite, usted DEBE cargar y aplicar las reglas de los siguientes archivos:

| Si la tarea es...          | Cargar estas Skills (Obligatorio)                                    |
| :------------------------- | :------------------------------------------------------------------- |
| **Maquetación / HTML**     | `./generacion-componentes-html/SKILL.md` y `./generacion-estilos/SKILL.md`        |
| **Lógica de Componente**   | `./generacion-componentes-ts/SKILL.md` y `./generacion-dtos/SKILL.md`        |
| **Conexión a API**         | `./generacion-servicios/SKILL.md` y `./generacion-dtos/SKILL.md`            |
| **Pruebas de Servicios**   | `./generacion-pruebas-servicios/SKILL.md`                                   |
| **Estructura Feature**     | `./reordenacion_arquitectonica/estructura_features.md` (Smart/Dumb, pages/components) |
| **Finalizar Tarea**        | `./generacion-documentacion/SKILL.md` (Siempre al terminar)                 |

## 7. Reglas de Oro del Frontend (Angular 21 / PrimeNG 21)

- **Standalone First:** Todo componente, directiva o pipe nuevo debe ser `standalone: true`.
- **Feature-Based Structure:** Todo componente nuevo debe crearse bajo `src/app/features/[modulo]/pages/` (Smart Components) o `src/app/features/[modulo]/components/` (Dumb Components). Los Smart Components inyectan servicios y manejan estado; los Dumb Components solo reciben `input()` y emiten `output()`.
- **Identidad:** Los colores y espaciados deben extraerse de `generacion-estilos.md`. No use colores "hardcoded".
- **PrimeNG:** Use componentes de PrimeNG (p-table, p-dialog, etc.) antes de crear elementos HTML nativos.
- **Inyección de Dependencias:** Use la función `inject()` para servicios si es posible, manteniendo consistencia con Java 21 en el naming de los DTOs.

## 8. Protocolo de Ejecución (Paso a Paso)

1. **Planificar:** Indique al usuario qué archivos `.ts`, `.html` y `.scss` va a crear o modificar.
2. **Ejecutar:** Aplique las reglas de las Skills seleccionadas en la tabla del punto 6.
3. **Documentar:** Ejecute la "Documentación Colocalizada" en el `README.md` de la carpeta del componente según `generacion-documentacion.md`.
