---
name: reglas-negocio
description: "Catálogo de reglas de negocio de un producto o de su plantilla base: cómo armarlo desde los manuales y minutas (identificador estable, módulo, origen explícita/inferida/propuesta, máscara, pregunta abierta), cómo usarlo al implementar, probar o revisar un módulo, qué reglas tienen detector en el escáner y qué revisar antes de cerrar. Úsala SIEMPRE que se implemente, modifique, pruebe o revise un módulo con reglas funcionales (usuarios, roles, catálogos, folios, bitácora, carga de archivos, fechas), o al especificar campos y validaciones."
---

# Reglas de negocio

Las reglas de un sistema (qué se valida, qué es único, quién puede hacer qué, qué no se puede borrar) viven en un **catálogo por módulo**.
Esta skill dice cómo se arma, cómo se usa y qué revisar. Los patrones de implementación de las reglas que se repiten en cualquier sistema
están en `rules/common/business-rules.md`; la corrección de cada detector, en `prevencion-hallazgos-seguridad-calidad`.

## El catálogo
Formato en `references/plantilla-catalogo.md`: una fila por regla con identificador estable `RN-<módulo>-<nnn>`, módulo, regla redactada
como condición verificable, **origen**, fuente (manual, minuta, contrato, con sección), máscara o patrón, y la pregunta que sigue abierta.

- **Dos archivos, una fuente:** `catalogo_reglas_negocio.md` (legible) y `catalogo_reglas_negocio.json` (para herramientas y pruebas), ambos
  generados desde la hoja que mantiene el dueño funcional. No se editan a mano: un cambio se hace en la hoja y se regenera.
- **El catálogo no certifica nada:** dice qué debe cumplirse, no que el código lo cumpla. Declarar si se verificó contra código, base de
  datos o ambiente, y cuándo.
- **Lee solo el módulo que vas a tocar**: un catálogo de cientos de reglas no se carga entero en el contexto.

## Cómo leer el origen (no es opcional)
| Origen | Qué significa | Qué hacer |
| :--- | :--- | :--- |
| **Explícita** | Está escrita en la fuente (manual, contrato) | Es requisito: impleméntala en el servidor **y** en la interfaz, y pruébala. |
| **Inferida** | Consecuencia razonable para consistencia o seguridad, **no** confirmada | Propónla al dueño funcional; mientras no la confirme, va como «por confirmar», nunca como requisito. |
| **Propuesta** | Validación o máscara técnica recomendada, **no** documentada | Igual que la inferida. Las expresiones regulares son para la entrada en la interfaz y se ajustan a longitudes y catálogos reales. |

El agente no convierte una inferida en requisito ni inventa la longitud, el catálogo o el patrón que la fuente deja abiertos: los anota como
pregunta para el dueño funcional.

## Al implementar o cambiar un módulo
1. Abre las reglas del módulo y marca cuáles toca el cambio.
2. Cada regla tocada va en la spec (`sdd`) con su identificador, y el commit o MR la cita.
3. La regla se aplica en el servidor (validación del DTO, autorización por método, restricción en la base); la interfaz la repite para dar
   buena experiencia, nunca en lugar del servidor.
4. Cada regla explícita tiene al menos una prueba que la ejerce (unitaria o funcional); la prueba cita el identificador
   (`verifiers/run.py --only spec_traceability` lo comprueba para los requisitos de la spec).
5. Al especificar campos y validaciones (entregable de diseño), un campo regido por una regla lleva su identificador y su máscara sale del
   catálogo; las inferidas o propuestas van «por confirmar».

## Qué detecta el escáner en el código
Solo unas pocas reglas dejan señal en el texto de un archivo; el resto se verifica ejecutando la aplicación (pruebas funcionales por rol).

| Regla del escáner | Regla de negocio que vigila |
| :--- | :--- |
| `PASSWORD-MIN-LENGTH-BELOW-STANDARD`, `PASSWORD-POLICY-NOT-ENFORCED` | Política de contraseñas en el DTO y en el formulario |
| `ACCOUNT-ENUMERATION-RESPONSE` | La recuperación no revela si la cuenta existe |
| `NUMERIC-CODE-STORED-AS-NUMBER` | Códigos con ceros significativos guardados como texto |
| `AUDIT-LOG-MUTATION-ENDPOINT` | Bitácora de solo consulta y solo agregar |
| `SVG-UPLOAD-WITHOUT-SANITIZATION`, `FILE-UPLOAD-NO-VALIDATION` | Tipo real y tamaño de los archivos cargados |
| `HTML-TEMPLATE-UNESCAPED-SUBSTITUTION` | Plantillas de correo y documentos escapan cada valor |
| `SEQUENTIAL-FOLIO-FROM-MAX` | Folios sin duplicados en concurrencia |
| `DESTRUCTIVE-ACTION-NO-CONFIRM` | Eliminar pide confirmación |
| `AUTHZ-NO-METHOD-AUTHZ` | Quién puede hacer cada acción, decidido en el servidor |

Un «0 hallazgos» solo dice que esos patrones no aparecen; no que el módulo cumpla el catálogo.

## Antes de dar por terminado un cambio en un módulo
1. ¿Cada regla explícita del módulo tocado está en el servidor y tiene una prueba que la ejerce?
2. ¿Las inferidas o propuestas implementadas están confirmadas por el dueño funcional, o declaradas como pendientes?
3. ¿El escaneo no tiene abiertos, en ese módulo, los hallazgos de la tabla de arriba?
4. ¿Los mensajes de error siguen el estándar de mensajes del proyecto y las validaciones el catálogo de validaciones?
