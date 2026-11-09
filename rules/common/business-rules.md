# Reglas de negocio: catálogo, origen y dónde viven

## Catálogo con origen
- Cada módulo funcional tiene un catálogo de reglas con identificador estable (p. ej. `RN-<módulo>-<n>`), su fuente (manual, minuta,
  contrato) y su **origen**: **explícita** (escrita en la fuente: es requisito), **inferida** (consecuencia razonable, no confirmada) o
  **propuesta** (validación técnica recomendada, no documentada).
- Solo las explícitas son requisito. Una inferida o propuesta se implementa cuando el dueño funcional la confirma; mientras tanto se declara
  como pendiente. El agente no convierte una propuesta en requisito ni inventa longitudes, catálogos o patrones que la fuente deja abiertos.
- El commit o MR que implementa o cambia una regla cita su identificador; cada regla tiene al menos una prueba que la ejerce.

## Dónde vive cada regla
- En el servidor siempre (validación del DTO, autorización por método, restricción en la base); en la interfaz además, nunca en lugar de.
- Unicidad con restricción `UNIQUE` en la base y manejo claro del duplicado (409), no solo comprobando antes de insertar.
- Un código que la fuente declara inmutable tras el alta no se acepta en el DTO de edición y la API lo rechaza aunque llegue.

## Patrones que se repiten en cualquier sistema
| Regla | Implementación correcta | Error típico |
| :--- | :--- | :--- |
| Identificadores numéricos con ceros significativos (código postal, claves territoriales) | Texto con máscara (`^[0-9]{5}$`) | `int`/`numeric`: 01000 se vuelve 1000 |
| Bitácora y auditoría | Solo consulta y solo agregar; retención por un proceso programado y auditado | Endpoints `PUT/DELETE` o `repository.delete` sobre la bitácora |
| Folio o consecutivo | `SELECT ... FOR UPDATE`, secuencia o `UPDATE ... RETURNING`, más `UNIQUE` | «el último + 1» sin bloqueo (folios duplicados en concurrencia) |
| Recuperación de contraseña | Mismo mensaje exista o no la cuenta; enlace de un solo uso con caducidad | «No se encontró el usuario con ese correo» |
| Plantillas HTML (correos, documentos) | Escapar cada valor al sustituir, o motor con escape automático | `template.replace("{{x}}", valor)` con el valor crudo |
| Carga de imágenes SVG | Sanitizar (sin scripts, `on*` ni referencias externas) o convertir a PNG | Aceptar `image/svg+xml` y servirlo tal cual |
| Inactivar vs. eliminar | Inactivar es reversible; eliminar se bloquea si hay dependientes y pide confirmación | Borrado en cascada silencioso |
| Rangos de fechas | Inicio ≤ fin; guardar ISO 8601 con zona si hay hora | Fechas imposibles o rangos invertidos aceptados |
| Secretos de configuración (contraseña SMTP, API keys) | Cifrados en reposo; nunca en listados, exportaciones ni respuestas | Devueltos en el DTO de consulta |
