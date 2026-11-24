# Spec: [Nombre del Cambio]

**Cambio:** `changes/YYYY-MM-DD-nombre/`  
**Estado:** BORRADOR | APROBADO  

---

## Requisitos funcionales

Cada requisito en formato EARS, observable desde fuera y sin tecnología: «CUANDO <evento>, EL SISTEMA DEBERÁ <respuesta>»,
«MIENTRAS <estado>, EL SISTEMA DEBERÁ…», «SI <condición no deseada>, ENTONCES EL SISTEMA DEBERÁ…».

| ID | Requisito (EARS) | Criterio de aceptación (y prueba) |
|----|-----------|------------------------|
| RF-01 | CUANDO [evento], EL SISTEMA DEBERÁ [respuesta] | [Cómo verificarlo] |
| RF-02 | ... | ... |

## Requisitos no funcionales

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01 | Tiempo de respuesta | < 200ms en P95 |
| RNF-02 | [seguridad, escalabilidad, etc.] | [métrica] |

## Restricciones mandatorias

*Las de abajo son las de un proyecto de ejemplo; cámbialas por las de tu organización. Si una tiene verificador, se cita entre paréntesis y `/opsx-verify` la comprueba con `verifiers/run.py`.*

- [ ] PKs: UUID v7 (`uuidv7()` en PG 18+) (verificador: `pk_uuid`)
- [ ] Audit triggers en tablas nuevas con mutaciones (verificador heurístico: `audit_triggers`)
- [ ] Autenticación en endpoints que modifican datos (verificador heurístico `endpoints_auth`: FastAPI, Spring, NestJS y Express; las rutas públicas a propósito van en `.agent/public-routes.txt`)
- [ ] Fallback local si servicio externo no disponible
- [ ] Volúmenes de servicios con estado mapeados a `./data/` (verificador: `compose_volumes`)

## Casos de borde

| Caso | Comportamiento esperado |
|------|------------------------|
| Servicio externo no disponible | Fallback a caché local (Valkey) |
| Input inválido | HTTP 422 con mensaje descriptivo |
| Concurrencia (dos usuarios a la vez) | `row_version` previene conflicto |

## Interfaces

```python
# Ejemplo: Modelo de datos
class NuevoModel(Base):
    id: UUID = Field(default_factory=uuid7)
    # ... campos
```

```typescript
// Ejemplo: API response
interface NuevoResponse {
  id: string;  // UUID v7
  // ...
}
```

## Exclusiones (fuera de scope)

- [Qué explícitamente NO se implementa en este cambio]
