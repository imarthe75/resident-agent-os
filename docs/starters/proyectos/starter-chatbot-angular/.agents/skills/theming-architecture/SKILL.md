# Theming Global - Arquitectura "Pro Default"

## 1. Filosofía de Diseño - Identidad Institucional (Pro Default)
Este proyecto utiliza una arquitectura de theming **"Pro Default"**. En lugar de permitir a los usuarios finales mezclar selectores de color libremente (lo cual puede romper la identidad visual de la marca), el sistema administra **Presets Institucionales Entregables**.

Cada Preset encapsula toda la identidad de la marca (Ej: C&A Smart, COMPRAMEX, Greyscale) de manera estricta y profesional. 

### Análisis de Presets Actuales
- **COMPRAMEX**:
    - **Guinda Institucional (#83213C)**: Fuerza, autoridad y presencia gubernamental.
    - **Oro Compramex (#BFA36D)**: Calidad, distinción y acento de marca.
- **C&A Smart Systems**: Identidad corporativa de la empresa (Steel Blue / Midnight).
- **Greyscale**: Tema técnico/neutral en blanco y negro (Mono-cromático).
- **Rainbow**: Demostración técnica del espectro cromático usando degradados.


---

## 2. Paleta Oficial (Design Tokens)

### Primitive Tokens (Colección Base)
| Token | Hex | Uso |
| :--- | :--- | :--- |
| **primary-500** | `#83213C` | Guinda Institucional (Headers, botones primarios). |
| **primary-gold**| `#BFA36D` | Oro Compramex (Botones secundarios, acentos). |
| **surface-100**| `#F4F4F4` | Fondos de búsqueda y filas alternas. |
| **text-main**   | `#4D4D4D` | Texto de formularios y cuerpo. |

### Semantic Tokens (Significado)
- **Primary**: `GUINDA` (Acciones de guardado, envío, descarga).
- **Secondary**: `ORO` (Acciones de selección, filtros, navegación).
- **Highlight**: Fondos suaves de guinda (`primary-50`).

---

## 3. Implementación técnica (PrimeNG Styled Mode)

El sistema utiliza el **Styled Mode** de PrimeNG con el preset `AppThemePreset`.

### Cómo cambiar colores globales
Edita el archivo: `src/app/layout/service/app.theme.ts`.

Ejemplo de aplicación de Guinda:
```ts
primary: {
    500: '#83213C',
    ...
}
```

---

## 4. Desarrollo de Componentes
- **Tablas**: Usa `[stripedRows]="true"`. Los encabezados aplican automáticamente el fondo guinda con texto blanco.
- **Botones**: 
    - `pButton`: Clase primaria usa Guinda.
    - `pButton severity="secondary"`: Clase secundaria usa Oro.

---

## 7. Guía: Cómo agregar un nuevo tema institucional

Para agregar una nueva identidad visual (ej: "Tema X") al sistema, sigue estos pasos:

### Paso 1: Crear el Preset
Crea un nuevo archivo en `src/app/layout/service/tema-x.theme.ts`:
```ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const TemaXPreset = definePreset(Aura, {
    semantic: {
        primary: {
            500: '#HEX_DIRECTO', // Color Base
            // ... resto de la paleta
        }
    }
});
```

### Paso 2: Registrar en el Configurador
En `src/app/layout/component/app.configurator.ts`:
1. Importa el nuevo preset: `import { TemaXPreset } from '@/app/layout/service/tema-x.theme';`
2. Añádelo al objeto `presets`:
```ts
const presets = {
    'Tema X': TemaXPreset,
    ...
}
```

### Paso 3: Definir Colores en la Interfaz (Opcional)
Si quieres que el color primario aparezca en los círculos de selección, agrégalo a la señal `primaryColors` en `app.configurator.ts`.

---

## 8. El "Master Showcase" (Rainbow Theme) - Guía Avanzada

El archivo `rainbow.theme.ts` fue construido como la **referencia técnica definitiva** para explorar las capacidades del PrimeNG Styled Mode. Si necesitas realizar personalizaciones extremas, estudia ese archivo. Aquí explicamos sus capas:

### Capa 1: Primitivos Múltiples (Semantic Primitives)
A diferencia de un tema normal, demuestra cómo mapear manualmente la escala `50` a `950` usando tonos de distintos colores para crear un efecto arcoíris. Esto prueba que no estás atado a un esquema monocromático para tu color primario.

### Capa 2: Sobrescritura de 'Color Schemes' Globales
Dentro de `semantic.colorScheme.light` y `dark`, el Master Showcase altera elementos transversales de la aplicación:
- **`formField`**: Personaliza genéricamente cómo reaccionan *todos* los formularios de la app al hacer `hover` o al estar `invalid`, centralizando la UX de los inputs.
- **`highlight`**: Modifica la selección global. Cuando haces transiciones con el teclado o seleccionas ítems de un Dropdown, la manipulación de este token permite teñir esos fondos con opacidades personalizadas (`rgba(...)`).
- **`text`**: Define el contraste de color estándar, color muteado y color al pasar el cursor sobre la tipografía de la app.

### Capa 3: Inyección de CSS Nativo y Pseudo-elementos
La característica más poderosa expuesta en el Rainbow Theme es la propiedad `css:`.
Si un Design Token no es suficiente (por ejemplo, quieres añadir una animación o manipular el `box-shadow` al hacer hover), puedes escupir CSS directamente en el componente:

```ts
card: {
    css: \`
        .p-card { transition: transform 0.3s ease; }
        .p-card:hover { transform: translateY(-4px); }
    \`
}
```
*Esto elimina la necesidad de tener archivos `.scss` separados para modificar comportamientos de UI de PrimeNG.*

### Capa 4: Gradientes y Valores Complejos en Componentes
El tema demuestra que propiedades como `background` dentro de `button.colorScheme.light.root.primary` no solo aceptan hexágonos planos (`#9C27B0`), sino funciones complejas de CSS como degradados iterativos (`linear-gradient(135deg, ...)`). Además, demuestra que los estados (ej. `hoverBackground`) pueden aceptar sus propios sub-degradados para mantener la interactividad rica y profesional.
