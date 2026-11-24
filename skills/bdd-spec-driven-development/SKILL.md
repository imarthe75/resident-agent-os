---
name: bdd-spec-driven-development
description: 'Guía y estándar agnóstico para agentes de IA para ejecutar Spec-Driven Development (SDD) y Behavior-Driven Development (BDD). Convierte reglas de negocio en especificaciones Gherkin (.feature) y suites de prueba automatizadas en Spring Boot.'
---

# Skill: Spec-Driven Development (SDD) & BDD en Spring Boot

Esta skill capacita a cualquier agente de inteligencia artificial (Antigravity, Copilot, Claude, etc.) para implementar un flujo riguroso de **Spec-Driven Development (SDD)** y **Behavior-Driven Development (BDD)**.

---

## 🎯 Objetivo de la Skill
Transformar requerimientos y reglas de negocio funcionales (tablas, requerimientos, documentos de análisis) en:
1. **Especificaciones Vivas:** Archivos `.feature` en lenguaje Gherkin (`Dado / Cuando / Entonces`) comprensibles tanto para negocio como para el sistema de pruebas.
2. **Tests Automatizados:** Pruebas de integración web y de servicios en Spring Boot (`MockMvc`, slices de controlador o tests de servicio) que actúan como contrato estricto.
3. **Detección Temprana de Brechas:** Identificar discrepancias entre la regla y el código Java antes de desplegar o refactorizar.

---

## 🔄 El Ciclo de 4 Fases (Pipeline para el Agente)

Cualquier agente debe ejecutar este flujo secuencialmente:

```
[ Reglas del Módulo ] 
        ⬇️ (Fase 1: Ingesta y Clarificación)
[ Matriz de Reglas Normalizada ]
        ⬇️ (Fase 2: Especificación Gherkin)
[ Archivo .feature en src/test/resources/features/ ]
        ⬇️ (Fase 3: Código de Pruebas de Integración)
[ Test de Especificación en src/test/java/ ]
        ⬇️ (Fase 4: Ejecución y Red-Green-Refactor)
[ Ajuste del Código Productivo ]
```

---

### FASE 1: Ingesta y Clarificación de Reglas de Negocio

Cuando el usuario pida especificar o probar un módulo, el agente **DEBE verificar o solicitar** la siguiente información estructurada:

#### 1. Formato de Ingesta Aceptado
El agente puede recibir las reglas en:
- Tablas con columnas: *Módulo / Funcionalidad / Regla de Negocio / Tipo (Explícita/Propuesta) / Tipo de Dato / Restricciones*.
- Historias de usuario o texto descriptivo.
- Código existente que necesita formalizar sus reglas.

#### 2. Checklist de Validación que el Agente debe aplicar
Antes de escribir el `.feature`, el agente debe revisar:
- [ ] **Inmutabilidad:** ¿Hay campos identificadores o claves que no deben modificarse al editar? (ej. códigos, slugs, identificadores de sistema).
- [ ] **Unicidad:** ¿Existen campos que exigen validación de conflicto (409) por unicidad? (ej. código alfanumérico, email, RFC/CURP).
- [ ] **Relaciones (1:N, N:M):** ¿Las asignaciones son individuales o masivas? ¿Se prohíben duplicados?
- [ ] **Ciclo de vida y eliminación:** ¿Es borrado físico o lógico (`borrado=true`, `activo=false`)? ¿Qué pasa si la entidad tiene relaciones hijas o activas?
- [ ] **Autorización y Seguridad:** ¿Qué roles o scopes de token son requeridos?
- [ ] **Listados y Búsqueda:** ¿Requiere paginación (`page`, `size`), ordenamiento (`sort`) y filtros dinámicos?
- [ ] **Concurrencia:** ¿Dos usuarios pueden editar el mismo registro? (escenario de 409 por `rowVersion` desactualizado).
- [ ] **Propiedad del recurso:** ¿Un usuario puede ver o editar registros de otra unidad/dueño? (escenario que debe responder 404).

> **Si alguna de estas reglas no está clara:** El agente debe formular preguntas precisas al usuario para despejar ambigüedades.
> Como máximo **5 preguntas, juntas en un solo mensaje**, y solo las que cambian el alcance o la regla de negocio; lo demás lo decide el
> agente y lo anota en la especificación como supuesto, para que el usuario lo vea y lo corrija.
>
> **Especificación viva:** si el código o una prueba contradice la especificación, primero se corrige la especificación (con el usuario,
> si cambia el alcance) y después el código. Nunca se ajusta el `.feature` para que pase un código que no cumple la regla.

---

### FASE 2: Creación del Archivo de Especificación (`.feature`)

El agente creará el archivo en la ruta:
`src/test/resources/features/<modulo>/<modulo>_<funcionalidad>.feature`

#### Estándar de Gherkin:
- Idioma: Español (`# language: es`) o Inglés (`# language: en`) según el estándar del proyecto.
- Tags organizativos: `@modulo @reglas_negocio @sdd`
- Estructura:
  - `Característica:` Título y objetivo de valor.
  - `Escenario:` Una regla o caso de uso específico (camino feliz o caso borde).
  - `Dado:` Precondición (usuario autenticado, registros existentes en base de datos).
  - `Cuando:` Acción ejecutada (invocación de endpoint REST con payload o parámetros).
  - `Entonces:` Resultado esperado (código HTTP, estructura de datos, mutación de estado).
  - `Y:` Verificaciones adicionales (eventos de auditoría, no duplicidad, etc.).

---

### FASE 3: Generación del Test Automatizado en Spring Boot

El agente debe implementar la suite de pruebas correspondiente utilizando las convenciones del repositorio.

#### Convenciones de este Backend:
1. **Envoltura Estándar de Respuesta:** Todas las respuestas REST usan `ResponseDto<T>`:
   - `responseCode`: `"200"`, `"201"`, `"400"`, `"404"`, `"409"`, etc.
   - `responseMessage`: Mensaje descriptivo constante (`Constant.MESSAGE_*`).
   - `data`: Objeto payload o lista.
   - `errorList`: Lista de errores en fallos de validación.
2. **Seguridad JWT:** Los endpoints protegidos usan `.with(jwt().jwt(j -> j.claim("roles", List.of("ADMIN"))))`. Cada regla con
   restricción de rol lleva **dos escenarios**: el rol permitido (2xx) y un rol sin permiso (403); y uno sin token (401).
3. **Slices Web:** Heredar de `AbstractWebMvcSliceTest` para montar la seguridad real y `GlobalExceptionHandler`, mockeando la capa de servicio con `@MockitoBean`.
4. **Pruebas de Servicio:** Usar `@ExtendWith(MockitoExtension.class)` para reglas profundas de lógica de negocio, cascada y auditoría.

#### Mapeo de Nombres:
- Clase de prueba de especificación: `<Modulo>SpecificationWebMvcTest.java`
- Agrupación por reglas con JUnit 5:
  ```java
  @WebMvcTest(ModuloController.class)
  @DisplayName("Especificación BDD: <Modulo>")
  class ModuloSpecificationWebMvcTest extends AbstractWebMvcSliceTest {

      @Nested
      @DisplayName("Regla: <Nombre de la Regla>")
      class ReglaEspecificaTest {
          @Test
          @DisplayName("Escenario: <Nombre del escenario del .feature>")
          void escenarioEspecifico() throws Exception {
              // Dado ...
              // Cuando ...
              // Entonces ...
          }
      }
  }
  ```

---

### FASE 4: Análisis de Brechas y Guía TDD

Tras crear la especificación y el test, el agente debe reportar al usuario:
1. **Reglas que ya cumple el código actual (Verdes).**
2. **Reglas que fallan o no están implementadas (Rojas):**
   - Discrepancias de contrato (ej. campos editables que la regla marcaba como inmutables).
   - Endpoints faltantes (ej. falta de paginación o asignaciones bulk).
   - Reglas de validación pendientes.
3. **Plan de Código Mínimo:** Explicar el cambio puntual en Service/Controller/DTO necesario para alcanzar el estado verde.

---

## 📋 Prompt Plantilla para Solicitar Reglas a Nuevos Módulos

Si un usuario o agente invoca esta skill para un nuevo módulo, debe utilizar este esquema de interacción:

```markdown
Para iniciar el flujo Spec-Driven Development (SDD) para este módulo, por favor proporciona las reglas de negocio en este formato:

| Módulo | Elemento / Campo | Regla de Negocio | Tipo | Restricción / Comportamiento Esperado |
|---|---|---|---|---|
| Ej. Trámites | Folio | Se genera automáticamente con formato YY-XXXX | Explícita | Inmutable, único |
| Ej. Trámites | Solicitante | Debe existir en catálogo y estar activo | Explícita | Error 400 si inactivo |

Con estos datos generaré:
1. El archivo `.feature` (especificación viva en Gherkin).
2. La suite de pruebas de integración BDD en Spring Boot.
3. El reporte de brechas de implementación.
```

## Catálogo de escenarios
Antes de escribir los `.feature`, arma el catálogo con la matriz de restricciones, las diez categorías (camino feliz, vacíos, formato,
límites, reglas, errores del servidor, autorización, estado, regresión y accesibilidad), la capa de cada caso y su política de dobles:
[`references/catalogo-escenarios.md`](references/catalogo-escenarios.md).

## Documentación y trazabilidad
- Cada escenario cita el requisito (`RF-xxx`) que prueba; un requisito sin escenario es un hueco de trazabilidad (`rules/common/delivery-process.md`).
- Etiquetas para que un ejecutor de pruebas funcionales identifique y trace cada escenario: id del caso (`@CI-59` o `@id:<x>`),
  requisito de origen (`@RQ-09`, en la característica o el escenario) y perfil con el que se ejecuta (`@actor:Administrador_general`, con
  guion bajo en lugar de espacio). Un escenario que ningún ejecutor automatiza queda «no ejecutado», nunca aprobado.
- Documentación del código bajo prueba: skill `documentacion-codigo-y-api`.

## Reglas del escáner que esta skill evita
`SMART-TESTS-ACCESS-CONTROL-FAILURE`, `SMART-TESTS-FORM-INVALID-SUBMITTED`, `TEST-SKIPPED-WITHOUT-REASON`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
