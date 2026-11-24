# Ejecución en Docker (sin instalar nada en el equipo)

Todos los scripts corren en contenedores. Las versiones de las imágenes coinciden con `package-lock.json` (Playwright 1.65.1);
si se actualiza `playwright-core`, se cambia la etiqueta de la imagen a la misma versión.

```bash
SKILL=<ruta a la skill>; TRABAJO=<carpeta de trabajo del módulo>; REPO=<raíz del sistema>

# Dependencias (una vez; quedan en node_modules/ de la skill, fuera de git)
docker run --rm --user $(id -u):$(id -g) -v $SKILL:/skill -w /skill node:26-slim npm ci --no-audit --no-fund

# Evidencia, validación de reglas y generación del .docx
docker run --rm --user $(id -u):$(id -g) -v $SKILL:/skill:ro -v $REPO:/repo:ro -v $TRABAJO:/trabajo -w /skill node:26-slim \
  node scripts/evidencia.js --repo /repo --front <ruta del feature> --back <Prefijo> --out /trabajo/evidencia.md
docker run --rm --user $(id -u):$(id -g) -v $SKILL:/skill:ro -v $REPO:/repo:ro -v $TRABAJO:/trabajo -w /skill node:26-slim \
  node scripts/render.js --data /trabajo/payload.json --reglas /trabajo/reglas_contrastadas.md --repo /repo --out /trabajo/salida/<Manual>.docx --estricto

# Capturas (navegador incluido en la imagen oficial de Playwright)
docker run --rm --user $(id -u):$(id -g) --network <red donde responde el sistema> -v $SKILL:/skill:ro -v $TRABAJO:/trabajo -w /skill \
  mcr.microsoft.com/playwright:v1.65.1-noble node scripts/capturar.js --guion /trabajo/guion_capturas.json
```

| Paso del flujo | En Docker |
|---|---|
| Fase 3 · Explorar | Con los ids y etiquetas de `evidencia.md` y el propio guion; no se usa la extensión de navegador ni servicios en la web |
| Fase 4 · Capturas | `--login` abre una ventana visible y no funciona en un contenedor sin pantalla. Usa `"sin_sesion": true` con `mocks` de datos ficticios (`ctx.route(...)`, ver `references/capturas.md`), o un `estado_sesion` generado fuera del contenedor con `--login`. Nunca se guarda, confirma ni elimina nada |
| Sesiones | `sesion*.json` y `*.local.json` contienen tokens: ya están en `.gitignore`; no se versionan ni se comparten |

Verificado: regresión 15/15 (`npm run regresion`), el ejemplo `examples/variables-sistema` genera su `.docx` y su hoja de validación,
y `capturar.js` produce capturas con resaltado y recorte dentro de `mcr.microsoft.com/playwright:v1.65.1-noble`.
