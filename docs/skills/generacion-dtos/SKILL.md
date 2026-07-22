---
skill: generacion-dtos
description: Guía canónica para generar, extender o modificar interfaces y DTOs TypeScript, siguiendo las convenciones y patrones del equipo.
---

# Spec: Generación de DTOs e Interfaces TypeScript

## Propósito

Este documento define las reglas, convenciones y plantillas que se  **deben seguir estrictamente** al crear, extender o modificar interfaces/DTOs TypeScript. Se debe consultar también cuando un servicio (ver `../generacion-servicios/SKILL.md`) requiere un DTO nuevo o modificado.

---

## 1. Modo de operación

Lo primero que se debe determinar es **qué tipo de acción se requiere**:

| Modo | Cuándo usarlo | Acción que se debe realizar |
|---|---|---|
| **A — Crear archivo nuevo** | No existe ningún archivo de modelos para este dominio | Crear carpeta + archivo nuevo con las interfaces indicadas |
| **B — Agregar interfaz a archivo existente** | El archivo ya existe, se añade una interfaz nueva dentro | Localizar el archivo y agregar la interfaz al final |
| **C — Modificar interfaz existente** | La interfaz ya existe pero se deben añadir, quitar o cambiar propiedades | Mostrar antes/después y aplicar el cambio puntual |

Preguntar si no queda claro en el contexto.

---

### Modo A — Crear archivo nuevo

Preguntas obligatorias:

| # | Pregunta | Uso |
|---|---|---|
| A1 | ¿Cuál es el nombre del dominio/entidad? (ej.: `tramite`, `fedatario-cargo`) | Nombre de carpeta y archivo en `kebab-case` |
| A2 | ¿Se crea una **carpeta nueva** o se incluye en una **carpeta ya existente**? | Decidir estructura de directorio |
| A3 | Si carpeta existente, ¿cuál es la ruta? (ej.: `src/app/core/models/caratula/`) | Ubicar correctamente el archivo |
| A4 | ¿Cuáles son las interfaces a incluir en el archivo? (nombres y campos) | Contenido del archivo |
| A5 | ¿Alguna propiedad referencia otra interfaz que ya existe? ¿De dónde se importa? | Agregar imports necesarios |

Resultado esperado:
```text
src/app/features/nombre-modulo/       ← carpeta del módulo (si no existe, se crea)
└── models/
    └── nombre-dominio.model.ts       ← archivo nuevo con interfaces
```

---

### Modo B — Agregar interfaz a archivo existente

Preguntas obligatorias:

| # | Pregunta | Uso |
|---|---|---|
| B1 | ¿Cuál es la ruta del archivo al que se agrega la interfaz? | Localizar el archivo |
| B2 | ¿Cuál es el nombre y los campos de la nueva interfaz? | Generar solo la interfaz nueva |
| B3 | ¿Alguna propiedad requiere un import que aún no está en el archivo? | Agregar import sin duplicar los existentes |

Reglas adicionales:
- **No modificar** ninguna interfaz existente en el archivo.
- Insertar la nueva interfaz al **final** del archivo.
- Si el import ya existe, no duplicarlo.

---

### Modo C — Modificar interfaz existente

Preguntas obligatorias:

| # | Pregunta | Uso |
|---|---|---|
| C1 | ¿Cuál es la ruta del archivo y el nombre exacto de la interfaz a modificar? | Localizar |
| C2 | ¿Qué cambia? (agregar propiedad, quitar propiedad, cambiar tipo, hacer opcional) | Aplicar cambio preciso |
| C3 | ¿El cambio agrega una dependencia a otra interfaz externa? ¿De dónde se importa? | Actualizar imports si aplica |

Reglas adicionales:
- Mostrar siempre el **antes** y el **después** de la interfaz antes de aplicar.
- **No tocar** ninguna otra interfaz del archivo.
- Si se elimina una propiedad, verificar si el import asociado queda huérfano y eliminarlo.

---

## 2. Ubicación base

Los nuevos DTOs e interfaces de un componente/módulo se ubican aisladamente en la carpeta `models` dentro de su respectivo módulo:

```text
src/app/features/nombre-modulo/models/
```

### 2.1 Módulo aislado vs Core compartido

| Criterio | Módulo aislado (`src/app/features/modulo/models/`) | Core compartido (`src/app/core/models/`) |
|---|---|---|
| La interfaz es específica de una vista/componente/módulo | ✅ Preferido | ❌ |
| La interfaz se comparte transversalmente en toda la aplicación | ❌ | ✅ Preferido |
| Ya existe una carpeta para ese dominio en la ruta específica | ✅ Usar la existente | — |

> **Regla general:** Por defecto, crear los modelos en la carpeta `models/` del feature al que pertenecen. Si se refactoriza un módulo antiguo, se deben migrar sus modelos específicos a la nueva estructura.

---

## 3. Nomenclatura de archivos

### 3.1 Nombre de carpeta
Siempre en `kebab-case`. Los modelos van directamente dentro de la carpeta `models/` del módulo, sin subcarpetas adicionales por dominio, a menos que sea estrictamente necesario.

### 3.2 Nombre de archivo

Todos los DTOs y modelos de dominio usan el sufijo unificado `.model.ts`:

```
nombre-dominio.model.ts    ✅  (DTO de API, modelo de dominio o UI)
```

**Regla:** No existe distinción entre `.interface.ts` y `.model.ts`. Todo es `.model.ts`.

### 3.3 Nombre de la interfaz
Siempre en `PascalCase` con sufijo descriptivo:

| Tipo | Sufijo | Ejemplo |
|---|---|---|
| Entidad principal del dominio | `Model` | `TramiteModel` |
| DTO de entrada (payload POST/PUT) | `Request` | `CrearTramiteRequest` |
| Interfaz de filtro/parámetros | `Filter` | `TramiteFilter` |
| Interfaz anidada/secundaria | Nombre descriptivo | `TitularCaratula`, `ActoTramite` |
| Interfaz base (para herencia) | `Base` | `TramiteBase` |

---

## 4. Patrones de interfaces — Plantillas

### 4.1 Interfaz simple (sin imports)

```typescript
export interface NombreDominioInterface {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}
```

### 4.2 Interfaz con propiedades opcionales

Usar `?` para campos que el backend puede omitir o que no siempre se envían:

```typescript
export interface NombreDominioInterface {
  id: number;
  nombre: string;
  descripcion?: string;       // opcional: puede no venir del backend
  fechaModificacion?: string; // opcional: solo presente en edición
  activo: boolean;
}
```

### 4.3 Interfaz con union types y nulos

Usar `| null` cuando el campo puede venir explícitamente como `null` desde el backend:

```typescript
export interface NombreDominioInterface {
  id: number;
  nombre: string;
  fechaCierre: string | null;   // el backend puede retornar null
  observacion: string | null;
}
```

> **`?` vs `| null`:**
> - `campo?` → el campo puede no estar presente en el objeto (undefined)
> - `campo: tipo | null` → el campo siempre está presente, pero su valor puede ser null
> - `campo?: tipo | null` → el campo puede estar ausente O venir como null

### 4.4 Interfaz con referencia a otra interfaz (con import)

```typescript
import { DetalleCatalogo } from '../catalogo-catalogos/catalogo-catalogos.model';

export interface NombreDominioInterface {
  id: number;
  nombre: string;
  estatus: DetalleCatalogo;           // referencia a otra interfaz
  categoria: DetalleCatalogo | null;  // referencia nullable
  titulares: TitularDominioInterface[]; // arreglo de interfaz en el mismo archivo
}

export interface TitularDominioInterface {
  id: number | null;
  nombre: string | null;
  rfc: string | null;
}
```

### 4.5 Interfaz con herencia (`extends`)

Usar cuando varias interfaces comparten una base común:

```typescript
interface NombreDominioBase {
  id: number;
  nombre: string;
  activo: boolean;
}

// La interfaz base NO lleva `export` si solo se usa internamente
export interface NombreDominioInterface extends NombreDominioBase {
  descripcion: string;
  fechaCreacion: string;
}

export interface NombreDominioFiltro extends Partial<NombreDominioBase> {
  fechaDesde?: string;
  fechaHasta?: string;
}
```

### 4.6 Interfaz con `Array` explícito vs notación shorthand

Ambas son válidas; usar la que mejore la legibilidad:

```typescript
// Shorthand (preferido para tipos simples)
items: NombreInterface[];

// Array explícito (preferido cuando el tipo es complejo o union)
items: Array<NombreInterface | null>;
```

### 4.7 Interfaz con `enum` o `type` alias

Cuando un campo tiene un conjunto fijo de valores conocidos:

```typescript
export type EstatusType = 'ACTIVO' | 'INACTIVO' | 'PENDIENTE';

export interface NombreDominioInterface {
  id: number;
  nombre: string;
  estatus: EstatusType;
}
```

---

## 5. Reglas de tipado

| ❌ Evitar | ✅ Usar | Motivo |
|---|---|---|
| `campo: any` | Tipo concreto o `unknown` | `any` elimina la seguridad de tipos |
| `campo: Object` | Interfaz específica | `Object` no tiene estructura |
| `id: String` | `id: string` | Los tipos primitivos van en minúscula |
| `fecha: Date` | `fecha: string` | El backend retorna fechas como strings ISO 8601 |
| `pernosubs: any` | `Partial<NombreInterface>` o interfaz específica | Documenta la forma real del dato |

> **Excepción tolerable:** campos de integración con librerías externas donde el tipo real es desconocido. Usar `unknown` y un comentario `// TODO: tipar cuando se conozca el contrato`.

---

## 6. Imports

### 6.1 Rutas relativas
Los imports **siempre** usan rutas relativas desde el archivo actual, **nunca** rutas absolutas:

```typescript
// ✅ Correcto — relativa al archivo actual
import { DetalleCatalogo } from '../catalogo-catalogos/catalogo-catalogos.model';
import { OficinaInterface } from '../oficina/oficina.interface';

// ❌ Incorrecto — ruta absoluta
import { DetalleCatalogo } from 'src/app/models/catalogo-catalogos/catalogo-catalogos.model';
```

### 6.2 Importar solo lo necesario

```typescript
// ✅ Solo las interfaces que se usan
import { DetalleCatalogo, ListDataCatalogos } from '../catalogo-catalogos/catalogo-catalogos.model';

// ❌ No importar toda la carpeta ni lo que no se referencia
```

### 6.3 Cuando se necesita un import nuevo (Modo B o C)

- Verificar primero si el import **ya existe** en el archivo.
- Si existe, no duplicarlo.
- Si no existe, agregarlo al **bloque de imports** al inicio del archivo, después de los imports existentes.

---

## 7. Separadores y comentarios dentro de la interfaz

El proyecto usa comentarios en línea (`//`) para anotar el estado, origen o notas del campo. Esta práctica es aceptable pero **opcional** en los nuevos archivos:

```typescript
export interface EjemploInterface {
  idRegistro: number;           // PK del registro
  fre: string;                  // Folio Real Electrónico
  estatus: DetalleCatalogo;     // catálogo: estatus del trámite
  fechaCierre: string | null;   // null si el trámite está abierto
}
```

Cuando el campo sea dudoso o ambiguo, agregar el comentario. No agregar comentarios obvios.

---

## 8. Un archivo — múltiples interfaces

Es válido y común tener **varias interfaces en un mismo archivo** cuando pertenecen al mismo dominio:

```typescript
// src/app/models/caratula-bienes-muebles/caratula-bienes-muebles.interface.ts

import { DetalleCatalogo } from '../catalogo-catalogos/catalogo-catalogos.model';

export interface CaratulaBienesMueblesInterface {
  idCaratulaBm: number;
  fre: string;
  oficina: DetalleCatalogo;
  estatus: DetalleCatalogo;
  titulares: TitularCaratulaBmInterface[];
}

export interface TitularCaratulaBmInterface {
  idCaratula: number | null;
  idTitular: number | null;
  nombre: string | null;
  rfc: string | null;
  porcentaje: string | null;
}

export interface CaratulaBmFiltro {
  fre?: string;
  idOficina?: string;
  idEstatus?: string;
}
```

> Regla: agrupar en un solo archivo las interfaces que **siempre se usan juntas o pertenecen al mismo caso de uso**. Si una interfaz se reutiliza en múltiples dominios, considerar extraerla a `catalogo-catalogos.model.ts` o crear un archivo utilitario compartido.

---

## 9. Ejemplo completo generado

**Escenario:** Crear el modelo para el dominio `expediente-digital` con tres interfaces.

**Archivo:** `src/app/features/expediente/models/expediente-digital.model.ts`

```typescript
import { DetalleCatalogo } from '@/app/core/models/catalogo-catalogos/catalogo-catalogos.model';

/**
 * Entidad principal del expediente digital.
 */
export interface ExpedienteDigitalModel {
  idExpediente: number;
  folio: string;
  fre: string;
  oficina: DetalleCatalogo;
  estatus: DetalleCatalogo;
  fechaApertura: string;
  fechaCierre: string | null;
  documentos: DocumentoExpedienteModel[];
}

/**
 * Documento asociado a un expediente digital.
 */
export interface DocumentoExpedienteModel {
  idDocumento: number;
  nombre: string;
  url: string;
  tipoDocumento: DetalleCatalogo;
  fechaCarga: string;
  vigente: boolean;
}

/**
 * Parámetros de búsqueda/filtro de expedientes.
 */
export interface ExpedienteDigitalFilter {
  folio?: string;
  fre?: string;
  idOficina?: string;
  idEstatus?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
```

---

## 10. Checklist de validación antes de entregar

### Modo A — Archivo nuevo
- [ ] La carpeta existe o fue creada en `kebab-case` dentro de `src/app/features/`
- [ ] El archivo usa el sufijo `.model.ts` (unificado)
- [ ] Todas las interfaces tienen `export`
- [ ] No se usa `any` (excepto con comentario `// TODO`)
- [ ] Los imports usan rutas relativas
- [ ] Los campos opcionales usan `?`, los nulables usan `| null`
- [ ] Las interfaces secundarias del mismo dominio están en el mismo archivo
- [ ] Las fechas son `string`, no `Date`
- [ ] Los nombres siguen `PascalCase` con sufijo `Model`, `Request`, `Filter`, etc.

### Modo B — Interfaz agregada
- [ ] La nueva interfaz está al final del archivo
- [ ] No se modificó ninguna interfaz existente
- [ ] Si se agregó import, no está duplicado
- [ ] El nombre de la interfaz sigue `PascalCase` con sufijo descriptivo

### Modo C — Interfaz modificada
- [ ] Se mostró el **antes** y **después** antes de aplicar
- [ ] Solo se modificó la interfaz indicada
- [ ] Los imports huérfanos (si se quitó una propiedad) fueron eliminados
- [ ] El cambio no rompe el tipado de otros archivos que usan esta interfaz

---

## 11. Referencias cruzadas

| Skill relacionada | Cuándo consultarla |
|---|---|
| `../generacion-servicios/SKILL.md` | Al crear un servicio que necesita un DTO nuevo |
| `../generacion-pruebas-servicios/SKILL.md` | Al generar pruebas para servicios que usan estos DTOs |
