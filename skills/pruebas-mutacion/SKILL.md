---
name: pruebas-mutacion
description: Mutation testing para comprobar que las pruebas detectan errores de verdad (PIT en Java/Spring, Stryker en Angular/TypeScript), solo sobre lo que cambió un merge request, con umbral que solo sube y el reporte guardado como evidencia. Úsala cuando se configuren o revisen pruebas unitarias, cuando las pruebas las haya escrito un agente de IA, o cuando la cobertura sea alta pero los errores lleguen igual a QA.
---

# Pruebas de mutación

La cobertura dice qué líneas **ejecutó** una prueba; no dice si la prueba **comprobó** algo. Una prueba sin aserciones útiles da 100 % de
cobertura. El mutation testing cambia el código a propósito (invierte una condición, devuelve `null`, quita una llamada) y vuelve a correr
las pruebas: si ninguna falla, ese «mutante» **sobrevivió** y esa línea no está verificada de verdad. Importa más cuando las pruebas las
escribe un agente de IA, que tiende a producir pruebas que pasan sin comprobar el resultado.

## Activar cuando
- se configuren las pruebas de un proyecto o su pipeline;
- un agente de IA haya escrito o modificado pruebas;
- la cobertura sea alta y aun así lleguen errores a QA.

## No activar cuando
- el proyecto no tiene pruebas unitarias todavía (primero `backend-pruebas-unitarias` / `generacion-pruebas-servicios`).

## Reglas
1. **Solo lo que cambió.** Sobre todo el proyecto tarda demasiado para un merge request. En el MR se mutan solo las clases/archivos de
   producción modificados; la corrida completa va en un pipeline programado (nocturno o semanal).
2. **Umbral que solo sube.** Se fija con el puntaje actual del proyecto (no con un número aspiracional) y se sube cuando el puntaje
   real lo supera; nunca se baja para que un MR pase. Proyecto nuevo: 60 % para empezar.
3. **El MR no puede bajar el puntaje** de las clases que toca. Un mutante sobreviviente en código nuevo se corrige con una aserción, no
   excluyendo la clase.
4. **Exclusiones declaradas.** Solo DTO/records sin lógica, configuración, código generado y clases de arranque; cada exclusión con motivo
   en el archivo de configuración. Nunca se excluye una clase porque «baja el puntaje».
5. **Leer los sobrevivientes, no solo el número.** Cada sobreviviente es una pregunta: ¿qué aserción falta? Los típicos:
   - condición negada que sobrevive → falta el caso del otro lado (p. ej. el 403 o el 409);
   - `return null`/valor vacío que sobrevive → la prueba no revisa lo que devuelve el método;
   - llamada eliminada que sobrevive (`VoidMethodCall`) → nadie verifica que se registró la auditoría o se guardó el cambio.
6. **Mutante equivalente** (el cambio no altera el comportamiento): se documenta en el MR; no se agrega una prueba artificial.

## Java / Spring Boot (PIT)
Plugin de Gradle `info.solidsoft.pitest` + `pitest-junit5-plugin`; versiones vigentes según `rules/common/versions.md`.

```groovy
pitest {
    junit5PluginVersion = '<vigente>'
    targetClasses = (project.findProperty('pitTargets') ?: 'mx.app.*').split(',') as List   // en el MR: solo las clases cambiadas
    excludedClasses = ['*.dto.*', '*.config.*', '*Application']                            // motivo: sin lógica / arranque
    mutators = ['DEFAULTS']
    outputFormats = ['XML', 'HTML']
    timestampedReports = false                                     // reporte en build/reports/pitest/mutations.xml
    withHistory = true                                             // análisis incremental entre corridas
    mutationThreshold = 60                                         // solo sube
    threads = 2
}
```

## Angular / TypeScript (Stryker)
`@stryker-mutator/core` + el runner que use el proyecto (Karma/Jasmine, Jest o Vitest); versiones vigentes.

```json
{
  "testRunner": "<runner del proyecto>",
  "mutate": ["src/app/**/*.ts", "!src/app/**/*.spec.ts", "!src/app/**/*.model.ts", "!src/environments/**"],
  "reporters": ["json", "html", "clear-text"],
  "jsonReporter": { "fileName": "reports/mutation/mutation.json" },
  "incremental": true,
  "thresholds": { "high": 80, "low": 60, "break": 60 }
}
```
En el MR: `npx stryker run --mutate "<archivos .ts cambiados, separados por coma>"`.

## Pipeline
- Plantilla de jobs para GitLab: `templates/ci/mutation-testing.gitlab-ci.yml`.
- El reporte (`mutations.xml` de PIT, `mutation.json` de Stryker) se guarda como artefacto del pipeline; si el proyecto tiene un tablero o
  escáner que lee reportes de CI, se le envía junto con JUnit y la cobertura.
- El puntaje es evidencia de calidad de pruebas (V&V); no sustituye a la revisión de las pruebas por otra persona.

## Checklist
- [ ] PIT/Stryker configurado con reporte XML/JSON en una ruta fija y exclusiones con motivo.
- [ ] Job de MR solo sobre lo cambiado; corrida completa programada.
- [ ] Umbral igual al puntaje real actual (o 60 % en proyecto nuevo) y sin bajarlo.
- [ ] Sobrevivientes del MR revisados: aserción agregada o mutante equivalente documentado.
- [ ] Reporte guardado como artefacto (y enviado al tablero del proyecto, si existe).
