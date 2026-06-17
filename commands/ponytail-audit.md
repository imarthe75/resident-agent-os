# /ponytail-audit

Escanea el repositorio completo en busca de sobre-ingeniería y código que puede subir de peldaño en el Efficiency Ladder.

## Uso

```
/ponytail-audit
/ponytail-audit --path backend/
/ponytail-audit --lang python
/ponytail-audit --lang typescript
```

## Qué hace

1. Indexa todos los archivos de código del scope indicado.
2. Busca patrones de sobre-ingeniería:
   - Wrappers de stdlib (re-implementaciones de `uuid`, `datetime`, `json`, etc.)
   - Dependencias instaladas no usadas
   - Custom helpers con equivalente nativo disponible
   - Abstracciones prematuras (clases con 1 método, factories para 1 tipo)
3. Genera un reporte priorizado por impacto (líneas ahorradas × frecuencia de uso).

## Formato de salida

```
[ponytail-audit] Repositorio: resident-agent-framework
Archivos analizados: 47  |  Hallazgos: 12  |  Ahorro estimado: ~320 líneas

ALTA PRIORIDAD (≥2 peldaños de mejora)
  memory/long_term_memory.py:89   → custom retry logic → tenacity (instalado)
  rules/python/rules.md           → documentar stdlib uuid en lugar de uuidv7 wrapper

MEDIA PRIORIDAD (1 peldaño)
  scripts/distribute_framework.py:34 → custom file walker → pathlib.Path.rglob

DEUDA MARCADA (ponytail:)
  memory/semantic_cache.py:45     → upgrade pendiente a pgvector native similarity
```

## Integración con quality-gate

Agregar al quality gate del proyecto:
```bash
# En commands/quality-gate.md
/ponytail-audit --path . && /ponytail-review --strict
```
