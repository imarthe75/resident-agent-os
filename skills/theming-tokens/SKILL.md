---
name: theming-tokens
description: "Tema visual de un frontend a partir de un solo tema.json (colores, tipografía, radio, modo oscuro): genera las escalas 50–950, variables CSS claro/oscuro, el bloque @theme de Tailwind 4, el preset de PrimeNG (@primeuix/themes) y un reporte de contraste WCAG AA que falla si el texto no se lee. Úsala al crear o cambiar la identidad visual de una aplicación, al agregar una marca o un modo oscuro, o cuando se pida «cambiar colores» sin tocar componentes."
---

# Theming por tokens desde un JSON

La identidad visual vive en **un archivo** (`tema.json`). Todo lo demás se **genera** y no se edita a mano: si un color cambia, se
cambia el JSON y se vuelve a generar. Así no hay colores sueltos en los componentes ni un tema que se lee mal.

## Activar cuando
- se crea un proyecto frontend o se cambia su marca;
- se agrega una marca más (un JSON por marca) o el modo oscuro;
- alguien quiere «cambiar un color» en un componente: el cambio va al JSON, no al componente.

## 1. El JSON
```json
{
  "nombre": "mi-marca",
  "colores": { "primario": "#1E5FA8", "secundario": "#14406F", "superficie": "#64748B",
               "exito": "#15803D", "advertencia": "#B45309", "error": "#B91C1C", "info": "#1D4ED8" },
  "tipografia": { "familia": "Inter, system-ui, sans-serif", "tamano_base": "14px" },
  "radio": "6px",
  "modo_oscuro": { "habilitado": true, "selector": ".app-dark" }
}
```
- Obligatorios: `nombre` (kebab-case), `colores.primario` y `colores.superficie` (el gris base de fondos, bordes y texto). Hex de 6 dígitos.
- Opcionales: `secundario` y los semánticos (`exito`, `advertencia`, `error`, `info`; si faltan se usan tonos que cumplen AA), `tipografia`,
  `radio`, `modo_oscuro`. Una clave desconocida es un error: evita erratas silenciosas.
- Ejemplos: `examples/tema.ejemplo.json` (cumple AA) y `examples/tema.contraste-bajo.json` (falla a propósito).

## 2. Generar
```bash
docker run --rm --user $(id -u):$(id -g) -v $PWD:/w -w /w node:26-slim \
  node <skill>/scripts/generar_tema.mjs --tema src/theme/tema.json --out src/theme/generado
```
| Archivo | Para qué |
|---|---|
| `tema.css` | Escalas `--color-<paleta>-50…950` y variables semánticas `--tema-*` en `:root` y en el selector del modo oscuro |
| `tailwind-theme.css` | Bloque `@theme` (`--color-primary-500` → clases `bg-primary-500`, `text-surface-700`…); se importa después de `tailwindcss` |
| `<nombre>.preset.ts` | Preset de PrimeNG: `providePrimeNG({ theme: { preset: MiMarcaPreset, options: { darkModeSelector: '.app-dark' } } })` |
| `contraste.md` | Razón de contraste de cada par que importa (texto, texto tenue, texto sobre botón y sobre cada color semántico) |

Código de salida: `0` todo bien · `1` JSON inválido (dice qué clave) · `2` algún par no llega a 4.5:1. Con `--permitir-contraste` genera
igual, pero el tema **no se entrega** así: se corrige el color o se documenta la excepción aprobada.

## 3. Reglas
1. **Nada de colores literales en componentes** (`#1E5FA8`, `bg-[#…]`, `style="color:…"`): solo tokens (`var(--tema-primario)`,
   `bg-primary-600`, tokens de PrimeNG). Un literal en el código es una deuda del tema.
2. **Los generados no se editan.** Llevan la cabecera «no editar a mano»; el cambio va al JSON y se regenera en el mismo commit.
3. **Contraste AA obligatorio** para texto (4.5:1). El generador elige para los botones el tono de la escala que sí cumple con texto
   blanco; si ningún tono cumple, el reporte falla.
4. **El color nunca es la única señal** (estado, error, éxito): va acompañado de texto o icono (WCAG 1.4.1).
5. **Modo oscuro por selector de clase**, el mismo en el preset y en `tema.css`; se prueba con el selector puesto antes de entregar.
6. **Una marca, un JSON.** Varias marcas = varios JSON y varios presets; nunca se mezclan colores de dos marcas en un archivo.

## 4. Verificar antes de entregar
- [ ] `generar_tema.mjs` sale con 0 y `contraste.md` sin «NO CUMPLE».
- [ ] Búsqueda de literales: `grep -rnE "#[0-9a-fA-F]{6}|bg-\[#|style=\"[^\"]*color" src/app` sin resultados nuevos.
- [ ] La aplicación se revisó en modo claro y oscuro (pantalla principal, un formulario con error y un diálogo).
- [ ] `tema.json` y los generados están en el mismo commit.

Verificado: el preset generado compila con TypeScript estricto contra `@primeuix/themes` 3.1.1; el ejemplo cumple AA en 12 pares y el
ejemplo de contraste bajo sale con código 2.
