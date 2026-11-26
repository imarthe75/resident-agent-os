# Arquitectura de temas en una aplicación (PrimeNG Styled Mode + Tailwind 4)

Cómo organizar los temas de una aplicación ya creada: dónde vive el preset, cómo se registran varios y qué se personaliza en cada capa.
El preset de cada marca se genera desde `tema.json` con esta skill; aquí se explica cómo encaja en la aplicación.

## 1. Presets curados, no selectores libres
La aplicación ofrece un conjunto cerrado de **presets entregables** (uno por marca o cliente, más uno neutral en escala de grises), cada uno
con toda su identidad: colores primarios y secundarios, superficies, texto y modo oscuro. El usuario elige un preset; no mezcla colores
sueltos, porque eso rompe la identidad y el contraste que se verificaron al generar el preset.

## 2. Tokens primitivos y semánticos
- **Primitivos:** la escala `50`–`950` de cada color de la marca (la genera `generate.py`).
- **Semánticos:** el significado (`primary` = acción principal: guardar, enviar; `secondary` = acciones de selección y navegación;
  `highlight` = selección; `surface` = fondos; `text` = cuerpo, atenuado y al pasar el cursor). Los componentes usan semánticos, nunca un
  hexadecimal: así un cambio de marca no toca componentes.

## 3. Dónde vive cada cosa
| Archivo | Contenido |
| :--- | :--- |
| `src/app/layout/service/<marca>.theme.ts` | `definePreset(Aura, {...})` generado desde `tema.json` |
| Componente configurador del layout | Mapa `presets = { '<Nombre visible>': <Marca>Preset, ... }` y, si se muestran, los círculos de color primario |
| `src/styles.css` | Bloque `@theme` de Tailwind 4 y variables CSS claro/oscuro generadas |

**Agregar una marca:** generar el preset desde su `tema.json`, guardarlo como `<marca>.theme.ts`, importarlo y añadirlo al mapa `presets` del
configurador. No se edita el preset de otra marca para crear una nueva.

## 4. Convenciones de componentes
- Tablas con filas alternas (`[stripedRows]="true"`); el encabezado toma el color primario del preset.
- Botón principal = `primary`; secundario = `severity="secondary"`. Ningún componente fija colores en su propio CSS.
- El foco visible no se elimina (`outline: none` sin reemplazo es un hallazgo de accesibilidad).

## 5. Personalización avanzada (cuando un token no alcanza)
1. **Escalas personalizadas:** la escala `50`–`950` puede mapearse a tonos de colores distintos; no hay obligación de una sola familia.
2. **Esquemas de color globales:** en `semantic.colorScheme.light` y `dark` se centraliza el comportamiento de `formField` (hover, inválido),
   `highlight` (selección con teclado o ratón, con transparencias) y `text`; así todos los formularios reaccionan igual.
3. **CSS propio del componente:** la propiedad `css` del preset de un componente acepta CSS (transiciones, sombras) y evita hojas `.scss`
   sueltas por componente.
4. **Valores complejos:** `background` y sus estados (`hoverBackground`) aceptan degradados además de colores planos.

Toda personalización vuelve a pasar el reporte de contraste (`contrast-report.md`) antes de entregarse.
