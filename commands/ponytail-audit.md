# /ponytail-audit

Busca sobre-construcción en todo el repositorio (o en una ruta). Solo lee y reporta.

## Uso

```
/ponytail-audit
/ponytail-audit --path backend/
```

## Qué hace

1. **Primero mide** con `python scripts/ponytail_audit.py <ruta>` (`--json` para procesarlo). Ejecuta las herramientas que ya estén
   instaladas, sin descargar nada:
   - Python: `vulture` (código muerto) y `deptry` (dependencias declaradas sin usar o usadas sin declarar);
   - TypeScript/JavaScript: `knip` (archivos, exportaciones y dependencias sin usar; desde `node_modules/.bin` del proyecto o el PATH);
   - cualquier lenguaje: `jscpd` (código duplicado, el peldaño de reutilizar) y `scc` (tamaño y complejidad, para comparar antes y después).
   Una herramienta ausente o que falla aparece como **no medido** con su motivo; nunca se cuenta como «limpio».
2. Luego revisa a mano los patrones de `/ponytail-review` en los archivos que las herramientas señalaron y en las carpetas compartidas (`utils`, `lib`, `services`, `components`).
3. Lista los marcadores de deuda (`/ponytail-debt`).

## Formato de salida

```
[ponytail-audit] backend/
Medido: vulture (12 avisos, 4 revisados como reales), deptry (2), jscpd (3 bloques duplicados). No medido: knip (no es proyecto JS).

memory/long_term_memory.py:89 — reintento propio. tenacity ya está instalado.
scripts/distribute_framework.py:34 — recorrido de archivos propio. pathlib.Path.rglob.
requirements.txt — numpy declarado, sin uso (deptry DEP002).

Deuda marcada: 3 marcadores, 1 sin condición (ver /ponytail-debt).
```

Los avisos de vulture y knip incluyen falsos positivos (código usado por reflexión, puntos de entrada, plantillas): cada uno se revisa antes de reportarlo como real. No se estiman líneas ahorradas.

## Integración con quality-gate

```bash
/ponytail-audit --path . && /ponytail-review --strict
```
