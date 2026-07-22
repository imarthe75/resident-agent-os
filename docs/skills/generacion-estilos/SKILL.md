---
skill: generacion-estilos
description: Guía canónica para la aplicación de estilos CSS/SCSS. Define jerarquía de archivos globales, convención de paleta corporativa y mejores prácticas para sobreescribir estilos de PrimeNG.
---

# Spec: Generación y Manejo de Estilos (CSS/SCSS)

## Propósito

Este documento establece las directrices para la creación y modificación de estilos (CSS/SCSS) en la aplicación, asegurando que se respete la identidad visual corporativa y proporcionando una convención segura para sobrescribir estilos originados por componentes de terceros (PrimeNG 21) en Angular 21.

---

## 1. Jerarquía de Archivos de Estilo

Cuando se necesite agregar o modificar estilos, debe respetar el siguiente orden de prioridad:

### 1.1 `src/assets/styles.scss` (Global Prioritario)

Es el punto de entrada principal para **estilos globales, utilitarios y sobrescrituras estructurales** de componentes de PrimeNG que deben aplicar a *toda* la aplicación.

- *Ejemplo de uso:* Ajustes a contenedores principales, redefinición de tamaño de fuentes globales para inputs (`input[pInputText] { font-size: 0.875rem }`), o configuraciones de grid/layout general.

### 1.2 `[nombre-componente].component.scss` (Local/Específico)

Para estilos que **únicamente** deben aplicar a la vista de un componente en particular. La IA debe siempre preferir esta ubicación para no contaminar el scope global, utilizando selectores específicos de ese componente.

---

## 2. Paleta Corporativa y Severidades de PrimeNG (Importante)

### 2.1 Prohibición de Severidades Estándar

**Queda estrictamente prohibido** utilizar las clases predeterminadas de severidad de PrimeNG para botones o etiquetas (tags/badges) a menos que sea una alerta explícita del sistema, ya que chocan con la identidad del sitio.

- ❌ NO USAR: `p-button-info`, `p-button-success`, `p-button-warning`, `p-button-danger` (excepto para alertas de destrucción real).

### 2.2 Uso de Botones Corporativos

Todo botón debe recaer en las dos categorías definidas en la UI:

- **Botón Primario (Positivo):** Sin clase extra.
- **Botón Secundario (Negativo/Cancelar):** `<p-button styleClass="p-button-secondary">`.

---

## 3. Override de Estilos sobre Componentes de Terceros (PrimeNG)

Angular encapsula los estilos (*ViewEncapsulation.Emulated* por defecto), lo que significa que el CSS escrito en un componente `.scss` no afectará a los elementos hijos generados dinámicamente por librerías como PrimeNG (ej. `.p-dropdown-panel`, `.p-dialog-content`).

### 3.1 El dilema de `::ng-deep`

Aunque `::ng-deep` está oficialmente *deprecado* (obsoleto) por el equipo de Angular, en la versión 21 sigue siendo la herramienta más directa y utilizada para "perforar" la encapsulación de la vista (View Encapsulation) sin tener que recurrir a estilos globales o desactivar completamente la encapsulación del componente.

### 3.2 Convención Obligatoria para Overrides Locales

Si se necesita modificar un estilo profundo de PrimeNG *sólo* para un componente específico, **DEBE** usar `::ng-deep` pero bajo **una estricta regla de contención** usando el selector `:host`.

Si no se envuelve en `:host`, `::ng-deep` filtrará los estilos al resto de la aplicación y la arruinará.

```scss
/* ✔️ CORRECTO - Totalmente contenido al componente actual */
:host {
  ::ng-deep {
    .p-datatable {
      .p-datatable-header {
        background-color: var(--surface-a);
        border-bottom: 2px solid var(--primary-color);
      }
    }
    
    /* Modificando un dropdown específico dentro de este componente */
    .p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
      background-color: var(--highlight-bg);
    }
  }
}
```

```scss
/* ❌ INCORRECTO - ¡Peligro! Esto afectará a TODOS los p-dropdown de la app */
::ng-deep .p-dropdown-panel .p-dropdown-items {
  padding: 0px; 
}
```

### 3.3 Alternativa Global

Si el override es deseado para **toda la aplicación** (por ejemplo, estandarizar el padding de todas las tablas), el estilo NO debe colocarse en un componente con `::ng-deep`, sino que debe ir directamente en **`src/assets/styles.scss`**.

---

## 4. Diseño Responsivo (Layouts)

- Evitar el uso excesivo de Media Queries manuales (`@media (max-width: ...)`).
- **Preferir clases de PrimeFlex:** Utilizar las clases utilitarias de flexbox y grid responsivo de PrimeFlex (`md:col-6`, `lg:col-4`, `flex-wrap`, etc.) provistas directamente en las plantillas HTML (ver spec de HTML).
- Las Media Queries manuales en archivos SCSS deben quedar restringidas a casos atípicos o customizaciones de animaciones.

---

## 5. Checklist de Validación

- [ ] ¿Los nuevos estilos globales se agregaron a `src/assets/styles.scss`?
- [ ] ¿Los botones añadidos evitan las severidades (`-info`, `-danger`) y usan los tonos corporativos primario/secundario?
- [ ] Si se modificó CSS de PrimeNG localmente (`::ng-deep`), ¿Está obligatoriamente dentro de un bloque `:host { }`?
- [ ] ¿Se intentó aplicar el layout usando las clases PrimeFlex de Angular antes de recurrir a CSS personalizado?
