# /opsx-verify

**Origen:** Adaptado de [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)  
Valida que la implementación cumple con lo especificado en `spec.md` antes de archivar.

## Uso

```
/opsx-verify
/opsx-verify changes/2026-06-17-agregar-jwt-reportes/
```

## Qué verifica

Lee `changes/<cambio>/spec.md` y valida cada requisito en tres dimensiones:

### 1. Completitud
¿Todos los requisitos del spec están implementados?

```
✅ JWT claims service implementado
✅ Audit trigger en tabla jwt_claims
❌ FALTA: rate limiting en endpoint /auth/token (mencionado en spec línea 14)
```

### 2. Corrección
¿La implementación hace lo que el spec dice que debe hacer?

```
✅ UUID v7 PK en tabla (spec req: "PKs deben ser UUID v7")
✅ OIDC middleware en endpoint sensible
⚠️  ADVERTENCIA: test de expiración de token cubre sólo happy path
```

### 3. Coherencia
¿La implementación es consistente con el resto del sistema?

```
✅ Naming convention snake_case en Python
✅ Audit trail registra en auditoria.log_auditoria
⚠️  ADVERTENCIA: response schema difiere del patrón en otros módulos
```

## Verificación determinista primero

Antes de que un agente interprete nada, ejecuta los verificadores de las restricciones mandatorias del spec:

```
python verifiers/run.py --path . [--only pk_uuid,compose_volumes,audit_triggers,endpoints_auth]
```

Cada uno responde `CUMPLE`, `NO_CUMPLE` o `NO_EVALUADO` (con su método: `static` o `heuristic`). Un `NO_CUMPLE` es bloqueante; un `NO_EVALUADO` se
informa tal cual y **no** cuenta como cumplido. Las compuertas de etapa (`.agent/gates/`, `agent/gates.py`) usan estos mismos verificadores y exigen que
cierre alguien distinto de quien ejecutó la etapa.

## Formato de reporte

```
[opsx-verify] Cambio: 2026-06-17-agregar-jwt-reportes

COMPLETITUD:   ✅ 8/9 requisitos (1 faltante — ver detalle)
CORRECCIÓN:    ✅ 100% tests pasan
COHERENCIA:    ⚠️  2 advertencias menores

FALTANTE (bloqueante):
  • Rate limiting no implementado (spec.md:14)

ADVERTENCIAS (no bloqueantes):
  • Test de expiración sólo cubre happy path
  • Response schema ligeramente diferente al patrón estándar

RECOMENDACIÓN: Resolver el ítem bloqueante antes de /opsx-archive
```

## Flags

- `--strict` — Trata las advertencias como errores (útil en CI)
- `--skip-tests` — Salta la ejecución de tests (sólo revisa artefactos)
- `--report` — Guarda el reporte en `changes/<cambio>/verify-report.md`
