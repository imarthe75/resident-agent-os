# Plantilla del catálogo de reglas de negocio

## Columnas (hoja fuente y `catalogo_reglas_negocio.md`)
| Columna | Contenido | Ejemplo |
| :--- | :--- | :--- |
| ID | `RN-<módulo de 2 dígitos>-<consecutivo de 3>`; nunca se reutiliza | `RN-02-003` |
| Módulo | Nombre del módulo funcional | Usuarios |
| Regla | Condición verificable, en presente | El correo del usuario es único en el sistema |
| Origen | `Explícita` · `Inferida` · `Propuesta` | Explícita |
| Fuente | Documento y sección (manual, minuta, contrato) | Manual de usuario de Usuarios §3.2 |
| Máscara / patrón | Para validación de entrada, si aplica | `^[^@\s]+@[^@\s]+\.[^@\s]+$` |
| Aspecto por confirmar / prueba | La pregunta abierta o la prueba que la demuestra | ¿Se distinguen mayúsculas en el correo? |

## Formato JSON (`catalogo_reglas_negocio.json`)
```json
{
  "fuente": "Hoja de reglas v3, 2026-11-20",
  "verificado_contra": "nada (solo documentos)",
  "modulos": [
    {"codigo": "02", "nombre": "Usuarios", "reglas": [
      {"id": "RN-02-003", "regla": "El correo del usuario es único en el sistema", "origen": "Explícita",
       "fuente": "Manual de usuario de Usuarios §3.2", "mascara": null, "por_confirmar": "¿Se distinguen mayúsculas en el correo?"}
    ]}
  ]
}
```

## Al generar
- El script que genera los dos archivos falla si un ID se repite, si falta el origen o si un ID cambió de módulo.
- `verificado_contra` dice la verdad: «nada (solo documentos)» hasta que alguien compare el catálogo con el código o el ambiente.
- El cambio del catálogo va por Merge Request con el dueño funcional como revisor.
