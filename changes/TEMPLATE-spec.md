# Spec: [Nombre del Cambio]

**Cambio:** `changes/YYYY-MM-DD-nombre/`  
**Estado:** BORRADOR | APROBADO  

---

## Requisitos funcionales

| ID | Requisito | Criterio de aceptación |
|----|-----------|------------------------|
| RF-01 | [Qué debe hacer] | [Cómo verificarlo] |
| RF-02 | ... | ... |

## Requisitos no funcionales

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01 | Tiempo de respuesta | < 200ms en P95 |
| RNF-02 | [seguridad, escalabilidad, etc.] | [métrica] |

## Restricciones mandatorias (CaSmarts)

- [ ] PKs: UUID v7 (`uuidv7()` en PG 18+)
- [ ] Audit triggers en tablas nuevas con mutaciones
- [ ] Autenticación OIDC en endpoints sensibles (via `auth.casmart.internal`)
- [ ] Fallback local si servicio externo no disponible
- [ ] Volúmenes mapeados a `./data/` si hay contenedores nuevos

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
