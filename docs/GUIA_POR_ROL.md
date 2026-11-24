# Guía del framework por rol

Reglas, subagentes, contextos y skills para que cualquier agente de IA (Claude Code, Codex, Gemini, Copilot) trabaje con estándares
verificables de seguridad, calidad y documentación. Como el código nace siguiendo las reglas que revisa un escáner de seguridad, un
análisis posterior arroja el mínimo de hallazgos. No hace falta tener el escáner para aprovecharlo.

**Cómo leer esta guía:** primero la instalación (una vez por proyecto), luego la sección de tu rol. El agente propone y una persona valida.

---

## 1. Instalación en un proyecto (una vez; la hace el líder técnico)
1. Distribuye el framework: `python scripts/distribute_framework.py --target /ruta/al/repo` (o `--parent` para varios repositorios).
   `--check` informa después qué repositorios se desviaron de la versión del framework.
2. Copia `skills/estandares-desarrollo/templates/AGENTS.md` y `CLAUDE.md` a la raíz del repositorio y llena la sección «Proyecto»: qué es,
   stack y versiones, cómo se levanta y se prueba, servicios externos (sin credenciales).
3. Si el proyecto ya tenía `AGENTS.md`/`CLAUDE.md`, conserva lo propio y añade las secciones del framework; gana la regla más estricta.
4. Para Claude Code, copia `agents/*.md` a `.claude/agents/` (subagentes) y `commands/*.md` a `.claude/commands/` (comandos `/team`,
   `/review`, `/audit`, `/debug`, `/opsx-*`). Para Gemini CLI, copia `templates/.gemini/settings.json` a la raíz y las skills a `.agents/skills/`.
5. Haz commit en una rama y fusiónalo por Merge Request revisado, como cualquier cambio.

Para comprobarlo, pregúntale al agente: «¿qué reglas obligatorias tienes para este proyecto?». Debe responder con las de `AGENTS.md`.

---

## 2. Desarrolladores (backend, frontend, base de datos, DevOps)

**Carga siempre:** `reglas-globales`, `estandares-desarrollo` y, antes de escribir o revisar código, `prevencion-hallazgos-seguridad-calidad`
(catálogo de cada regla del escáner con cómo escribir el código para no provocarla, y la lista de chequeo de entrega).

**Qué skill según lo que vas a hacer**
| Tarea | Skills |
|---|---|
| Catálogo o módulo completo (BD, backend y pantalla) | `modulo-crud-estandar` |
| Módulo o endpoint Spring Boot | `backend-base-spring`, `backend-modulo-crud` o `backend-endpoint-paginado`, `backend-soporte-api`, `backend-persistencia-jpa`, `backend-seguridad` |
| Tema visual (colores, modo oscuro, marca) | `theming-tokens`: un `tema.json` genera variables CSS, Tailwind, el preset de PrimeNG y el reporte de contraste |
| Backend FastAPI | `backend-fastapi` |
| Pantalla Angular | `primeng21-expert`, `generacion-componentes-ts`/`-html`, `generacion-servicios`, `frontend-auth-oidc`, `frontend-heuristicas-usabilidad` |
| Migración o modelo de datos | `database-liquibase-postgresql`, `postgres-audit` |
| Proyecto nuevo, Dockerfile, pipeline | `backend-proyecto-gradle`, `java-springboot`, `backend-pruebas-unitarias` (versiones vigentes con `scripts/latest_versions.py`) |
| Documentar | `documentacion-codigo-y-api`, `generacion-documentacion` |
| Manual de usuario de un módulo | `manuales-usuario` (reglas contrastadas contra el código, capturas reproducibles, `.docx` generado por script con hoja de validación; identidad en `references/marca.json`) |
| Algo falla | `systematic-debugging` (comando `/debug`: subagente depurador con prueba de regresión) |
| Funcionalidad no trivial o requisitos ambiguos | `/opsx-propose` → `/opsx-apply` → `/opsx-verify` (spec con requisitos EARS y convergencia contra pruebas) |
| Cambio grande | `blueprint` o `writing-plans` antes de tocar código |
| Repartir el trabajo entre varios agentes | `delegacion-subagentes` (comando `/team`) |

**Flujo de un cambio**
1. **Parte de un requisito** (ticket o caso de uso). Sin requisito no hay trazabilidad.
2. **Plan corto:** pídele al agente qué archivos tocará, qué reglas del catálogo aplican y cómo se verificará.
3. **Prueba primero** (`test-driven-development`): un caso que debe pasar y otro que debe fallar; en la API, el 401/403/409.
4. **Código y documentación juntos:** `@Operation`/`@ApiResponses` con ejemplos en cada endpoint y Javadoc en los servicios; TSDoc en
   servicios y componentes; `COMMENT ON` en cada tabla y columna nueva; README del módulo y ADR si tomaste una decisión de arquitectura.
5. **Antes del Merge Request:** lista de chequeo de `prevencion-hallazgos-seguridad-calidad`, pruebas ejecutadas y, si tienes escáner,
   córrelo sobre tus cambios. Pide revisión con `/review` y `/audit` (subagentes
   `code-reviewer` y `security-reviewer`, solo lectura): hallazgos P0–P4 y veredicto APTO / APTO CON OBSERVACIONES / NO APTO.
6. **Merge Request** con descripción, requisito ligado, salida real de las pruebas y revisor distinto del autor. CI en verde.

**Pídeselo así al agente (ejemplos)**
- «Genera el CRUD de Sedes con permiso base `CATALOGO_SEDES`, siguiendo `backend-modulo-crud`. Incluye pruebas de 403 y OpenAPI completo.»
- «Revisa este controlador contra el catálogo de `prevencion-hallazgos-seguridad-calidad` y dime qué reglas provocaría.»
- «El reporte de seguridad marca `AUTHZ-NO-METHOD-AUTHZ` y `JPA-ENTITY-MISSING-VERSION` en estos archivos: corrígelos con su prueba.»

**No negociable:** ninguna credencial en código, configuración, pruebas ni chat (si llegó a git, se rota); nada de datos simulados,
`TODO` ni funciones vacías en el código de la aplicación; ni skills, plugins o scripts de terceros sin autorización ni código del
proyecto en servicios de la web (`rules/common/privacidad-y-herramientas.md`); entrega con estado honesto (COMPLETADO / PARCIAL / FALLIDO) y salida real de pruebas.

---

## 3. Líderes de proyecto y PM

Usa el framework para que el trabajo del equipo y de los agentes deje **evidencia verificable**.

**Carga:** `metodologia-entrega` (etapas, entregables, compuertas de cierre, adaptación y control de cambios), `cumplimiento-cmmi-iso` (qué evidencia CMMI / ISO 27001 produce el trabajo diario), `triage-findings` (cómo leer un reporte de
seguridad) y las reglas `rules/common/delivery-process.md` (requerimientos, diseño, pruebas y soporte) y `rules/common/business-rules.md`.
Si el proyecto tiene una metodología propia, gana la del proyecto.

**Ritmo con agentes:** planea por ciclos cortos (cada tarea se planea, implementa y revisa en horas, con MR pequeños) en lugar de un
bloque largo de implementación con revisión al final; mide lo terminado y revisado. Los roles se solapan: involucra a QA y a desarrollo
desde los requerimientos (skill `metodologia-entrega`, «Dentro de la construcción»). Antes de cerrar un cambio, pide `/demo` para verlo
funcionar contra sus criterios y `/adversarial` para una revisión independiente.

**Al iniciar:** confirma que el framework está distribuido y `AGENTS.md` tiene la sección «Proyecto» llena; registra si el contrato
permite cargar el código del cliente a herramientas de IA (si lo prohíbe, el agente no lo lee ni lo envía); define que todo Merge Request
lo revisa alguien distinto del autor y que el CI debe estar en verde para fusionar.

**Durante el proyecto**
- **Requerimientos:** pide al agente revisar cada uno contra los seis campos de `delivery-process.md` (nombre, actor, camino principal,
  alternos, reglas, criterios comprobables). La decisión es del analista.
- **Documentos formales:** lo que redacta la IA lleva una marca visible de revisión humana; firmas, fechas de sesión, decisiones y montos
  los llena una persona.
- **Control de cambios:** lo nuevo que pide el cliente en una sesión va a control de cambios; no se acepta en silencio.
- **Seguridad:** al recibir un reporte del escáner, separa vulnerabilidades de calidad y cumplimiento con `triage-findings`.

**Qué exigir al equipo (y al agente)**
| Pide | Por qué |
|---|---|
| Cada cambio ligado a un requisito y fusionado por Merge Request revisado | Trazabilidad y revisión por pares |
| Pruebas ejecutadas con su salida real | Verificación; «pasó» sin evidencia no cuenta |
| Cero hallazgos nuevos del escáner por Merge Request, o su justificación | Codificación segura (ISO 27001 8.28) |
| Versiones etiquetadas y ADR por decisión técnica | Gestión de configuración y decisiones |
| Lo no verificado declarado como tal | Un porcentaje inflado es peor que un pendiente honesto |

---

## 4. Testers y QA

**Carga:** `rules/common/delivery-process.md` (diseño de casos, reporte de hallazgos, pruebas de aceptación), `bdd-spec-driven-development`
y `bdd-frontend-playwright`, `frontend-heuristicas-usabilidad` y `prevencion-hallazgos-seguridad-calidad` (sección 9: comprobaciones en ejecución).

**Catálogo primero:** arma el catálogo completo de escenarios (matriz de restricciones, diez categorías, capa y política de dobles) antes
de priorizar: `bdd-spec-driven-development/references/catalogo-escenarios.md`. Para ver una funcionalidad funcionando contra sus criterios,
pide `/demo <requisito>`.

**Desde los requerimientos:** escribe los casos de aceptación mientras se especifica, no cuando ya está construido; cada caso cita el ID
del requisito (`@RF-01`) para que el verificador `spec_traceability` encuentre la prueba. Durante la implementación revisa cada MR
pequeño contra sus casos, sin esperar al final.

**Diseño de casos:** primero lo crítico para el negocio; cada alterno y cada regla con su caso; cada caso con el **usuario del actor**,
nunca con un administrador; no se prueba lo que no está listo (sin revisión, sin pruebas en verde o sin desplegar). Pide al agente:
«A partir de este requerimiento, propón los casos: camino principal, cada alterno y cada regla, con el rol que ejecuta cada uno».

**Comprobaciones de seguridad y calidad que sí te tocan**
| Qué probar | Cómo | Regla relacionada |
|---|---|---|
| Un rol sin permiso no ve ni ejecuta la función | Entrar con ese rol: la opción no aparece y la API responde 403 | `SMART-TESTS-ACCESS-CONTROL-FAILURE`, `AUTHZ-NO-METHOD-AUTHZ` |
| Un perfil no ve datos de otros | Dos usuarios de distinta unidad, comparar lo que recibe cada uno | `RUNTIME-PII-IN-RESPONSE`, `POTENTIAL-IDOR-NO-OWNERSHIP-CHECK` |
| El formulario no se envía con datos inválidos y marca cada campo | Vacíos, formatos incorrectos, límites | `SMART-TESTS-FORM-INVALID-SUBMITTED`, `SMART-TESTS-FORM-NO-FIELD-ERROR` |
| Ninguna pantalla normal provoca un error 500 | Recorrer el flujo con la consola del navegador abierta | `RUNTIME-SERVER-ERRORS` |
| El token no aparece en la consola ni en la URL | Herramientas del navegador: consola y red | `RUNTIME-TOKEN-IN-CONSOLE`, `FRONTEND-TOKEN-IN-URL` |
| Borrar o revocar pide confirmación | Ejecutar la acción destructiva | `DESTRUCTIVE-ACTION-NO-CONFIRM` |
| Accesibilidad básica | Solo teclado; lector de pantalla en formularios; foco visible | `WCAG-*` |

El escáner no verifica el contraste, el orden de lectura, las trampas de teclado ni las reglas de negocio que solo se ven al usar la
aplicación: eso es tuyo. Las pruebas de carga o de fuerza bruta no se hacen contra ambientes compartidos sin autorización escrita.

**Reportar un hallazgo:** reproducible (pasos, datos de prueba, usuario y rol, evidencia sin datos reales de personas); confirma antes que
no sea una regla intencional del cliente; al revalidar, prueba la corrección y lo que la rodea, y si falla reabre el **mismo** defecto.

**Calidad de las pruebas automatizadas** (skill `pruebas-mutacion`): la cobertura no dice si una prueba comprueba algo. El mutation
testing (PIT, Stryker) altera el código a propósito; cada mutante que sobrevive es una aserción que falta. Pide el puntaje y la lista de
sobrevivientes del MR, sobre todo cuando las pruebas las escribió un agente.

**Pruebas de aceptación:** el usuario ejecuta y registra. Si contradice un criterio aprobado es **defecto**; si pide algo que ningún
criterio cubre es **cambio**.

---

## 5. Seguridad
**Carga:** `triage-findings`, `prevencion-hallazgos-seguridad-calidad` y, para auditar un proyecto sin escáner, `auditoria-codigo`
(mismas reglas, evidencia Cierto/Probable/Hipótesis, matriz con plazos y comparativo entre corridas). La clasificación (vulnerabilidad / falso positivo / riesgo
aceptado) es del analista; un falso positivo se decide por repositorio y archivo, nunca como regla general; nunca se reproducen secretos en
un informe; quien corrige no valida su propio cierre. Para revisar un cambio: `/audit` (subagente `security-reviewer`, solo lectura).

---

## 6. Preguntas frecuentes
- **¿Necesito un escáner?** No. Las skills dicen cómo escribir el código; si el proyecto tiene uno, `preflight` consulta los hallazgos
  abiertos antes de editar.
- **¿Qué hago si una regla choca con lo que pide el cliente?** Gana la más estricta y se registra la decisión (ADR o control de cambios).
- **¿Puedo instalar una skill, plugin o servidor MCP que encontré en internet?** No sin autorización escrita: se adapta la idea dentro
  del repositorio y entra por Merge Request (`rules/common/privacidad-y-herramientas.md`).
- **¿El agente puede firmar o aprobar algo?** No. Propone; una persona revisa, decide y firma.
