# /ponytail-review

Revisa el diff actual buscando lo que sobra: qué se puede borrar o simplificar según la escalera de eficiencia (`rules/common/efficiency.md`). No revisa estilo.

## Uso

```
/ponytail-review
/ponytail-review --strict
```

## Qué hace

1. Toma el diff (`git diff --staged`, o `git diff HEAD` si no hay nada en staging).
2. Por cada bloque nuevo, busca:
   - una abstracción con una sola implementación (interfaz, fábrica o envoltorio para un único caso);
   - algo que reimplementa la biblioteca estándar o una utilidad que el proyecto ya tiene (buscarla con `scripts/codebase-map.js` o grep);
   - una dependencia nueva para lo que ya hace una instalada o unas pocas líneas;
   - una opción de configuración que nunca cambia, código "para después" sin quien lo llame;
   - código donde una capacidad nativa basta (restricción de BD, CSS, `<input type>`);
   - un atajo sin marcador `shortcut: <límite>, <cuándo mejorarlo>`;
   - lógica nueva no trivial sin ninguna prueba.
3. **No señala** (nunca se recorta): validación en límites de confianza, manejo de errores que evita pérdida de datos, seguridad, accesibilidad, documentación obligatoria, ni lo que el requerimiento pidió.

## Formato de salida

Una línea por hallazgo, sin preámbulo:

```
backend/app/utils/uuid_helper.py:12 — generador de UUID propio. Usar uuid.uuid4() de la biblioteca estándar.
frontend/src/utils/debounce.ts:8 — debounce propio. lodash.debounce ya está instalado.
src/billing/rfc.ts:41 — atajo sin marcador. Añadir "shortcut: solo valida formato, antes de facturar".

3 hallazgos en 3 archivos.
```

No se estiman líneas ni tokens ahorrados: es una opinión del revisor, no una medición.

## Modo --strict

Termina con error si hay algún hallazgo de abstracción sin uso, dependencia innecesaria o lógica nueva sin prueba. Útil como compuerta antes del commit.
