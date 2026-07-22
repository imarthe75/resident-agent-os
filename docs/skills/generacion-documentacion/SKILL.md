---
skill: generacion-documentacion
description: Reglas para mantener la documentación y bitácoras colocalizadas (archivos README.md) en cada módulo o componente de la aplicación, definiendo qué cambios se registran y el formato a seguir.
---

# Spec: Mantenimiento de Documentación de Módulos

## Propósito

Este documento establece la estrategia de "Documentación Colocalizada" (Collocated Documentation). En lugar de usar un `CHANGELOG.md` monolítico que genera conflictos de git (merge conflicts) y es difícil de mantener, la IA deberá crear y actualizar un archivo `README.md` **dentro de la carpeta del módulo o componente principal** que está modificando.

---

## 1. Convención de Archivos

- **Ubicación:** Dentro del nivel más alto del módulo lógico o componente principal afectado.
  - Ejemplo: `src/app/features/bitacora-correos/README.md`
- **Responsabilidad de la IA:** Cuando la IA finalice una tarea importante en ese módulo, debe verificar si el `README.md` existe. Si no existe, lo crea con la plantilla base de abajo. Si existe, agrega el cambio a la bitácora.

---

## 2. Umbral de Documentación (Cuándo Documentar)

Para que el archivo no se vuelva "interminable" ni un lastre para los desarrolladores, **solo** debe agregar un registro al `README.md` en los siguientes casos:

### 2.1 ✅ SÍ SE DOCUMENTA (Impacto Estructural o Lógico)

- Creación de un nuevo componente, servicio o módulo.
- Integración de nuevos endpoints o cambio en el contrato de la API (DTOs).
- Cambios significativos en la lógica de negocio (ej. modificaciones en cómo se validan filtros complejos o cálculos).
- Agregado de modales (Cuadros de diálogo) o flujos secundarios dentro del módulo.
- Refactorización mayor que modifique el flujo de datos (Subject/Observable).

### 2.2 ❌ NO SE DOCUMENTA (Modificaciones Menores)

- Corrección discreta de errores tipográficos en HTML/TS.
- Ajustes finos de CSS/SCSS (paddings, márgenes, colores).
- Renombrado de variables internas o refactorizaciones pequeñas que no alteran el output.
- Actualización de tipado básico en TypeScript.
- Modificaciones a pruebas unitarias (`.spec.ts`).

---

## 3. Plantilla Base para Módulos Nuevos (`README.md`)

Cuando se tenga que crear la documentación inicial para un módulo (o componente que actué como vista principal), usará este formato en formato Markdown:

```markdown
# Módulo: [Nombre del Módulo o Pantalla]

**Propósito:** Breve descripción de la responsabilidad de esta pantalla/módulo dentro de la arquitectura de RPP (ej. "Pantalla principal para la administración y reenvío de correos fallidos de la plataforma.").
**Dependencias Clave:** (ej. `BitacoraCorreosService`, `ManejoErroresService`, DTOs asociados).

---

## Bitácora de Cambios Significativos (Changelog Local)

_Formato:_ `- **[YYYY-MM-DD]** ([Nombre del desarrollador]): [Descripción breve del cambio estructural]`

- **[Fecha de creación]** ([Nombre del desarrollador]): Inicialización del módulo y estructura base.
```

---

## 4. Patrón de Actualización (Append)

Cuando se deba registrar un cambio significativo en un `README.md` existente, escribirá al final de la sección `## Bitácora de Cambios Significativos`, siguiendo estrictamente el estándar del bullet-point:

```markdown
- **2024-03-10** ([Nombre del desarrollador]): Se conectó el modal de edición al endpoint `PUT /usuarios-sos/:id` mediante inject() y se estandarizó el uso de PrimeFlex para los filtros de búsqueda.
```

## 5. Checklist de Documentación

- [ ] ¿El cambio alcanzó el umbral del impacto estructural (nuevos flujos, APIs, lógica)? Si es "No", omitir cualquier actualización al README.
- [ ] ¿Se guardó el registro en el `README.md` local de la carpeta y no de manera global?
- [ ] ¿Se respetó el formato estándar: Fecha, Autor (IA o nombre del Dev aportado) y resumen conciso?
