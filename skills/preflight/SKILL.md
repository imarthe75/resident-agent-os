---
name: preflight
description: Antes de editar archivos de un proyecto, consulta al escáner de vulnerabilidades configurado qué hallazgos abiertos ya existen en esos archivos. Úsalo al inicio de una tarea de código ("revisa antes de tocar", "qué problemas hay en estos archivos") o cuando vayas a modificar código sensible (autenticación, pagos, configuración).
---

# Preflight: qué se sabe de los archivos que vas a tocar

Requiere (opcional) un servicio escáner con este contrato — configurado por entorno, el framework funciona igual sin él:

```
PREFLIGHT_URL=https://escaner.ejemplo          PREFLIGHT_TOKEN=...   (si el servicio lo pide)
GET {PREFLIGHT_URL}/api/preflight?asset=<activo>&paths=ruta/a.java,ruta/b.ts
```

## Pasos
1. Lista los archivos que la tarea va a modificar (rutas relativas al repositorio) y el nombre del activo en el escáner.
2. Consulta el escáner:
   ```bash
   curl -sf -G "$PREFLIGHT_URL/api/preflight" --data-urlencode "asset=<activo>" --data-urlencode "paths=<ruta1>,<ruta2>" \
        ${PREFLIGHT_TOKEN:+-H "Authorization: Bearer $PREFLIGHT_TOKEN"}
   ```
   Dentro del repositorio del framework también sirve el cliente `agent.preflight_client` (`query`, `summarize`).
3. Lee el resultado con estas reglas:
   - **«Sin hallazgos» no es «limpio»**: solo que ningún motor marcó ese archivo en el último escaneo. Revisa `engines_seen` y la fecha.
   - **Activo desconocido o servicio caído** = sin información. Dilo; no lo trates como cero hallazgos.
   - Un hallazgo `CRITICAL`/`HIGH` en un archivo que vas a tocar es parte de la tarea: menciónalo al usuario antes de editar.
4. No corrijas hallazgos que la tarea no pidió; repórtalos.

## Sin escáner (o además de él): revisar las funciones que vas a tocar
Antes de empezar, recorre las funciones de los archivos que la tarea va a modificar y marca las que ya tienen alguno de estos defectos:
- **Varias responsabilidades** en una sola función.
- **Oculta errores**: `catch` vacío o que devuelve un valor por omisión sin registrar nada.
- **Muta la entrada**: modifica un parámetro que recibió en lugar de devolver uno nuevo.
- **Números mágicos**: constantes sin nombre que deciden comportamiento (montos, límites, tiempos).
- **Lógica duplicada** con otra función.

Presenta una tabla corta (función, archivo, defecto, severidad) y una recomendación de orden: qué conviene corregir **antes** de la tarea
porque la tarea lo va a tocar o lo va a empeorar, y qué puede esperar. Si una marca parece falso positivo, dilo. Las funciones sin marca no
necesitan más análisis. Corregir lo marcado es otro cambio (o una tarea previa), no algo que se mezcla en silencio con la tarea.

Esta skill solo lee. No modifica hallazgos ni el escáner.

Qué significa cada regla abierta y cómo corregirla: skill `prevencion-hallazgos-seguridad-calidad`.
