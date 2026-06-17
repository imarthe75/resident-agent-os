# /ponytail-debt

Compila todos los marcadores `ponytail:` del repositorio en un ledger accionable de deuda técnica de eficiencia.

## Uso

```
/ponytail-debt
/ponytail-debt --by-priority
/ponytail-debt --by-file
```

## Qué hace

1. Busca todos los comentarios `# ponytail:` (Python) y `// ponytail:` (TypeScript/JS/SQL) en el repo.
2. Clasifica por prioridad: **alta** (stdlib/native disponible hoy) | **media** (dependencia existente) | **baja** (refactor futuro).
3. Genera un ledger markdown listo para convertir en issues o tareas de sprint.

## Formato de salida

```
# Ponytail Debt Ledger — 2026-06-17

## Alta prioridad (quick wins)
- [ ] memory/semantic_cache.py:45 — upgrade a pgvector native similarity
      Beneficio: -35 líneas, -1 dependencia (numpy)

## Media prioridad
- [ ] backend/app/utils/format.py:12 — usar f-strings nativas vs format_helper()
      Beneficio: -8 líneas

## Baja prioridad
- [ ] scripts/distribute_framework.py:67 — migrar a pathlib una vez en Python 3.12+
      Beneficio: -15 líneas, más legible

Total deuda: 3 ítems | Ahorro estimado: ~58 líneas
```

## Integración con el Rito de Cierre

Al terminar sesión, ejecutar `/ponytail-debt` y agregar los ítems nuevos al sprint backlog o a `.agent/STATE.md` en la sección **Próximos Pasos**.
