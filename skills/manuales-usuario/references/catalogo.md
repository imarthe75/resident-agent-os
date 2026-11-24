# Catálogo de módulos → manual, front y back

Resuelve «haz el manual de X» → qué carpeta del front, qué prefijo del back y qué manual previo sustituye. Cada proyecto mantiene
su propia tabla aquí (o en `documentacion/Manuales/catalogo.md` del sistema), derivada del código, no preguntada.

| Módulo (como se pide) | `--front` (bajo `front/src/app/features/`) | `--back` (prefijo de clases) | Manual previo |
|---|---|---|---|
| Variables del sistema | `variables-sistema` | `VariableSistema` | ejemplo: `examples/variables-sistema/` |
| <módulo> | `<carpeta>` | `<Prefijo>[,<Prefijo2>]` | `<archivo>` o «— (sin manual)» |

Cómo llenar un renglón:
- **`--front`**: la carpeta del módulo en el front (la que contiene su ruta y su pantalla).
- **`--back`**: el prefijo común de sus clases (controlador, servicio, entidad). Un prefijo corto trae clases vecinas (`Rol` incluye
  `RolPrivilegio`): no estorba, pero ignora lo que no sea del módulo.
- **Manual previo**: el documento que este sustituye. Si se generó con otro código de documento, confirma con el líder de proyecto el
  código oficial antes de generar.

`evidencia.js` indexa back Java (defecto), Python (`--back-ext py`) y TypeScript (`--back-ext ts`), y front `.ts`, `.html`, `.tsx`,
`.jsx`. Para otro lenguaje se contrasta a mano y se dice así en el encabezado de `reglas_contrastadas.md`.

**Fuera de alcance:** manuales técnicos (instalación, configuración, despliegue). Son otra plantilla.
