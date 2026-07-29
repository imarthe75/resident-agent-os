---
skill: generacion-componentes-react
description: Guía canónica para generar o extender páginas/componentes React (Vite + Tailwind v4) en proyectos del portafolio, siguiendo los patrones reales validados en consulta-smart (banners, tokens semánticos, confirmaciones, layout de scroll). Complemento de `generacion-componentes-ts`/`generacion-componentes-html` (específicos de Angular) para el stack React.
---

# Skill: Generación de Páginas/Componentes React

## Alcance

Este skill aplica a proyectos con frontend **React + Vite + Tailwind CSS v4**
(`consulta-smart` es la referencia). Cada regla proviene de un bug real encontrado
y corregido durante la auditoría/desarrollo de `consulta-smart` (2026-07-22) — no
son preferencias de estilo arbitrarias.

---

## 1. Encabezado de página — usar `ModuleBanner`, no inventar uno nuevo

Toda página de "módulo" (no el chat de pantalla completa) debe usar
`components/ModuleBanner.jsx` para su encabezado — badge, título, subtítulo, ícono
decorativo, y un slot `actions` (controles) o `tabs` (navegación) según lo que
necesite. **No crear un degradado ad hoc con colores de Tailwind sueltos**
(`from-blue-700 via-indigo-700...`) — el hallazgo real que motivó `ModuleBanner`
fue exactamente eso: 4 páginas, 4 degradados distintos, ninguno usando los tokens
de marca reales (`--color-primary`/`--color-secondary`).

```jsx
<ModuleBanner
    badgeIcon={MiIcono}
    badgeLabel="Descripción corta en mayúsculas"
    title="Título de la página"
    subtitle="Una frase explicando qué hace este módulo."
    decorIcon={MiIcono}
    actions={<button>...</button>}   // o tabs={[...botones de navegación]}
/>
```

---

## 2. Colores — usar los tokens semánticos, no Tailwind ad hoc

Para estados (éxito/advertencia/error/info), usar las variables CSS ya definidas en
`index.css` (`--cs-success`, `--cs-warning`, `--cs-danger`, `--cs-info`, cada una
con su `-bg`) o las clases `.cs-chip--{success,warning,danger,info}` — **no**
elegir `emerald-600`/`blue-500/10`/etc. a discreción por archivo. Estos tokens ya
tienen variantes light/dark resueltas; los colores Tailwind sueltos no.

```jsx
<span style={{ backgroundColor: 'var(--cs-success-bg)', color: 'var(--cs-success)' }}>
    Indexado
</span>
```

---

## 3. Confirmación antes de acciones destructivas o sensibles

Cualquier acción que borre algo, o que cambie un permiso/rol, debe pedir
confirmación explícita con `window.confirm(...)` (mismo mecanismo en todo el
proyecto, no un modal custom por pantalla) **antes** de llamar a la API. Esto
incluye no solo "Eliminar" sino también escalaciones de privilegio ("Hacer Admin")
— el hallazgo real: el botón de otorgar rol admin no pedía confirmación mientras
que "Eliminar Tema" sí, inconsistencia que se corrigió.

```jsx
const handleDelete = async (id) => {
    if (!window.confirm('¿Confirmas eliminar X? Esta acción no se puede deshacer.')) return
    await api.delete(`recurso/${id}`)
}
```

---

## 4. Layout de scroll — un solo contenedor con `overflow-y-auto`, nunca dos anidados

`App.jsx` ya envuelve toda página ruteada en `<main className="flex-1 h-full
overflow-y-auto">` — **ese es el único contenedor de scroll real**. Ninguna página
debe repetir `overflow-y-auto` en su propio `<div>` raíz. Aunque ese div nunca
llegue a desbordarse a sí mismo (por lo que "no debería" causar ningún problema
visible), declarar `overflow` distinto de `visible` en un ancestro lo convierte en
el contenedor de referencia para `position: sticky` de sus descendientes — **rompe
cualquier elemento flotante/sticky que agregues después**, de forma no obvia
(no hay error en consola, el elemento simplemente "deja de flotar" en cierto punto
del scroll). Antes de agregar `overflow-y-auto` a una página nueva, verificar que
ningún ancestro ya lo tenga.

```jsx
// Correcto:
<div className="flex-1 p-6 ...">  {/* sin overflow-y-auto: App.jsx ya lo maneja */}

// Incorrecto (rompe sticky en el futuro, aunque hoy "funcione"):
<div className="flex-1 overflow-y-auto p-6 ...">
```

---

## 5. Ningún componente huérfano — todo componente debe estar conectado

Si se crea un componente nuevo dentro de `components/admin/` (o equivalente), debe
quedar **importado y renderizado** por su página padre en el mismo cambio que lo
crea — no "listo para conectar después". El hallazgo real: dos paneles completos y
funcionales (`PromptRegressionPanel.jsx`, `LLMObservabilityPanel.jsx`) existieron
sin que ningún archivo los importara; el backend funcionaba pero nadie podía llegar
a la pantalla. Verificar con un grep del nombre del componente antes de considerar
la tarea terminada:

```bash
grep -rln "NombreDelComponente" frontend/src --include="*.jsx" | grep -v "components/"
# si no hay resultados fuera de su propia carpeta, está huérfano
```

---

## 6. Feedback de estado — reutilizar el patrón existente, no inventar uno nuevo

El patrón `setMessage({ type: 'success'|'error'|'info', text })` con un banner
renderizado condicionalmente ya existe (`AdminPage.jsx`) — reutilizarlo en vez de
crear un sistema de notificaciones nuevo por página. Si se necesita un tipo nuevo
de mensaje, extender el `switch`/ternario de estilos existente, no bifurcar.

---

## 7. Documentación colocalizada

Todo módulo/carpeta de componentes nueva sigue `docs/skills/generacion-documentacion/SKILL.md`
— `README.md` con changelog de cambios estructurales, no de cada ajuste de CSS.

---

## 8. Checklist antes de dar por terminado un componente/página nueva

- [ ] ¿Usa `ModuleBanner` para su encabezado (si es una página de módulo)?
- [ ] ¿Usa los tokens `--cs-*`/`.cs-chip--*` para colores de estado, no Tailwind ad hoc?
- [ ] ¿Toda acción destructiva/sensible pide `window.confirm` antes de llamar a la API?
- [ ] ¿Su `<div>` raíz evita `overflow-y-auto` redundante?
- [ ] ¿Está realmente importado y renderizado por su página padre (no huérfano)?
- [ ] ¿Reutiliza el patrón de feedback existente en vez de uno nuevo?
- [ ] ¿Tiene (o actualizó) su `README.md` colocalizado si el cambio es estructural?
