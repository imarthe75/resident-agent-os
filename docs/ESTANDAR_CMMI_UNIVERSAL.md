# Estándar Universal de Prácticas CMMI — Portafolio C&A Smart Systems

**Alcance: universal / multi-proyecto.** Igual que `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`
(seguridad) y `docs/skills/generacion-documentacion/SKILL.md` (documentación), este
documento es portable — aplica a `consulta-smart`, `idp-smart`, `lexivault-ai` y
cualquier proyecto nuevo del portafolio, sin importar el stack. Se copia tal cual a
cada repositorio o se referencia desde su `CLAUDE.md`/`AGENTS.md`.

**Origen y alcance del mandato:** el 2026-07-22 se comunicó que todos los proyectos
deben cumplir con CMMI. El framework real vigente es **CMMI 2.0** (la numeración
"v5" que motivó este documento se interpreta como el objetivo de **Nivel de Madurez 5
— Optimización**, el nivel más alto de la escala 1-5, no una "versión 5" del modelo).
Este documento traduce las áreas de proceso de los Niveles 2 a 5 en prácticas
concretas y verificables con las herramientas que este equipo ya usa (git, revisión
de código, documentación colocalizada, auditorías de seguridad) — **no sustituye**
una evaluación formal SCAMPI por evaluadores certificados, que es lo único que
otorga una certificación real de nivel de madurez. Este documento cierra la brecha
práctica del día a día; una certificación formal es una decisión organizacional
aparte, con costo y tiempo propios, que debe evaluarse por separado si es el
objetivo real.

---

## 0. Cómo usar este documento

- Cada área de proceso (PA) se presenta con: qué exige CMMI en esencia, qué evidencia
  ya genera (o debería generar) este equipo con sus herramientas actuales, y un
  checklist de brecha.
- Marca cada práctica como **[Cumple]** (evidencia real y verificable existe hoy),
  **[Parcial]** (existe informalmente, sin ser sistemático/documentado) o **[Falta]**
  (no existe evidencia). Esta es la misma disciplina de honestidad que exige
  `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` §8 — no declares "cumple" sin evidencia.
- No se espera cumplir el 100% de inmediato. El objetivo es tener, por proyecto, un
  diagnóstico honesto y un plan de cierre de brechas priorizado.

---

## 1. Nivel 2 — Gestionado (fundamentos, por proyecto)

### 1.1 Gestión de Requisitos (REQM)
**Exige:** los requisitos se documentan, se rastrean cambios, y el trabajo se
mantiene alineado a ellos.
**Con las herramientas actuales:** issues/tickets como fuente de requisitos;
`docs/requirements/` (ya existe en `consulta-smart/docs/requirements`) como
repositorio de especificaciones; cada commit/PR debería referenciar qué requisito
atiende.
**Checklist:**
- [ ] Existe un lugar único (no disperso en chats) donde vivan los requisitos activos.
- [ ] Los cambios de alcance quedan registrados (no solo "se decidió en una llamada").
- [ ] Se puede rastrear, para una funcionalidad ya construida, qué requisito la originó.

### 1.2 Planificación de Proyecto (PP) / Monitoreo y Control (PMC)
**Exige:** un plan (alcance, estimación, cronograma, riesgos) y seguimiento real
contra ese plan, con acción correctiva cuando se desvía.
**Con las herramientas actuales:** `TodoWrite`/tableros de tareas para el trabajo en
curso; memoria de proyecto (`project` memories) para decisiones y fechas.
**Checklist:**
- [ ] Todo proyecto activo tiene un plan mínimo (qué se va a construir, para cuándo).
- [ ] Existe una revisión periódica real (no solo al final) que compare avance vs. plan.
- [ ] Las desviaciones significativas generan una acción documentada, no solo se absorben en silencio.

### 1.3 Gestión de Configuración (CM)
**Exige:** control de versiones de todos los artefactos (código, documentos, configuración), con historial y capacidad de revertir.
**Con las herramientas actuales:** git para código; sin embargo, se detectó en esta
misma sesión que `chatbot_profiles` (datos de configuración de negocio) **no tiene
control de versiones ni bitácora de cambios** — un hallazgo real de brecha CM, no solo
teórico (ver incidente del tema "general" corrupto sin forma de revertir, 2026-07-22).
**Checklist:**
- [ ] Todo el código está en git con historial real (no solo el estado final).
- [ ] La configuración de negocio crítica (no solo código) tiene versión/historial — **brecha conocida en consulta-smart: `chatbot_profiles` sin auditoría de cambios.**
- [ ] Existe una política de baseline/etiquetado (tags/releases) para versiones que se despliegan a producción.

### 1.4 Aseguramiento de Calidad de Proceso y Producto (PPQA)
**Exige:** verificación objetiva e independiente de que el proceso y el producto
cumplen lo definido — no autoevaluación únicamente.
**Con las herramientas actuales:** skill `/code-review` y `/code-review ultra`
(revisión multi-agente independiente); `docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`
como catálogo objetivo de qué auditar.
**Checklist:**
- [ ] Todo cambio significativo pasa por una revisión que no sea la misma persona/sesión que lo escribió.
- [ ] Las auditorías de seguridad (ver estándar maestro) se ejecutan con regularidad, no solo ante incidentes.
- [ ] Los hallazgos de auditoría/revisión se documentan con nivel de evidencia ([Cierto]/[Probable]/[Hipótesis]), no como opinión.

### 1.5 Gestión de Acuerdos con Proveedores (SAM)
**Exige:** control formal sobre dependencias externas (APIs de terceros, contratistas, servicios SaaS).
**Con las herramientas actuales:** inventario de API keys/proveedores por tema (ver
LLM personalizado por tema en `consulta-smart`); Vault para secretos.
**Checklist:**
- [ ] Existe un inventario actualizado de qué servicios externos usa cada proyecto y con qué credenciales.
- [ ] Hay un plan de respaldo si un proveedor externo falla (ver fallback multi-LLM ya implementado como buen ejemplo real).

### 1.6 Medición y Análisis (MA)
**Exige:** métricas objetivas del proceso y del producto, usadas realmente para decidir.
**Con las herramientas actuales:** panel de Observabilidad del enrutador LLM en
`consulta-smart` (tasa de satisfacción, proveedores activos) es un ejemplo real y
ya funcionando de esta práctica — replicar el patrón en otros proyectos.
**Checklist:**
- [ ] Cada proyecto define al menos 2-3 métricas objetivas de calidad/uso.
- [ ] Esas métricas se revisan periódicamente, no solo cuando algo falla.

---

## 2. Nivel 3 — Definido (estandarizado entre proyectos)

### 2.1 Desarrollo/Gestión de Requisitos avanzada (RD), Solución Técnica (TS), Integración (PI), Verificación (VER), Validación (VAL)
**Exige:** procesos de ingeniería estandarizados y reutilizables entre proyectos, no
reinventados cada vez.
**Con las herramientas actuales:** `docs/skills/` (generacion-servicios,
generacion-dtos, generacion-componentes-*, generacion-pruebas-servicios) son
exactamente esto — estándares de ingeniería reutilizables entre proyectos. Ya existen
para el stack Angular/PrimeNG; **brecha real:** no existen aún equivalentes para
proyectos React/FastAPI como `consulta-smart` (se documentó como conformidad parcial
en `MANUAL_TECNICO_DESARROLLADOR.md` §10).
**Checklist:**
- [ ] Existe una guía de "cómo generar un servicio/componente/DTO nuevo" por stack tecnológico usado en el portafolio.
- [ ] Los criterios de aceptación (pruebas, validación) están estandarizados, no a discreción de cada desarrollador.

### 2.2 Enfoque y Definición de Procesos Organizacionales (OPF, OPD)
**Exige:** la organización (no cada proyecto por separado) define y mejora sus
procesos estándar.
**Con las herramientas actuales:** `docs/` a nivel raíz de `/opt/casmart` (compartido
entre proyectos) es el lugar correcto para estos estándares organizacionales — este
mismo documento y `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` son ejemplos reales.
**Checklist:**
- [ ] Los estándares organizacionales viven en un solo lugar compartido, no duplicados/divergentes por proyecto.
- [ ] Hay un mecanismo real (no solo intención) para proponer y aprobar mejoras a esos estándares.

### 2.3 Entrenamiento Organizacional (OT)
**Exige:** las personas tienen las habilidades necesarias, de forma planificada, no ad-hoc.
**Checklist:**
- [ ] Existe onboarding documentado para alguien nuevo en un proyecto (qué leer primero, qué skills/estándares aplican).
- [ ] Los manuales técnicos (`MANUAL_TECNICO_DESARROLLADOR.md` y equivalentes) se mantienen actualizados como material de referencia real, no solo al momento de escribirlos.

### 2.4 Gestión Integrada de Proyecto (IPM)
**Exige:** el proyecto se gestiona con los procesos estándar de la organización, adaptados, no un proceso propio aislado.
**Checklist:**
- [ ] El proyecto usa los estándares universales (`docs/ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`, este documento) en vez de inventar los suyos.

### 2.5 Gestión de Riesgos (RSKM)
**Exige:** identificación proactiva de riesgos, no solo reacción a incidentes.
**Con las herramientas actuales:** los hallazgos de auditoría marcados como
"documentado, no corregido" (ver `MANUAL_TECNICO_DESARROLLADOR.md` §8, ej. SEC-02,
BOLA-01) son exactamente un registro de riesgos aceptados conscientemente — buena
práctica real ya en uso, formalizarla como "registro de riesgos" explícito.
**Checklist:**
- [ ] Existe un lugar único donde viven los riesgos conocidos y aceptados de cada proyecto (no solo dispersos en manuales técnicos).
- [ ] Cada riesgo aceptado tiene una razón explícita de por qué no se resolvió aún, no solo "no dio tiempo".

### 2.6 Análisis de Decisiones y Resolución (DAR)
**Exige:** decisiones importantes con criterios explícitos y alternativas evaluadas, no solo intuición.
**Checklist:**
- [ ] Decisiones de arquitectura relevantes (ej. elegir Smart LLM Router propio vs. Flowise) quedan documentadas con el razonamiento, no solo el resultado.

---

## 3. Nivel 4 — Gestionado Cuantitativamente

### 3.1 Rendimiento de Procesos Organizacionales (OPP) / Gestión Cuantitativa de Proyecto (QPM)
**Exige:** los procesos se gestionan con datos estadísticos reales (no solo métricas
puntuales), y se usan para predecir resultados.
**Estado real:** esto es un salto significativo desde el Nivel 2/3 — requiere
historia de métricas suficiente (varios ciclos/proyectos) antes de ser viable.
**Checklist (aspiracional, no inmediato):**
- [ ] Se recolectan métricas de forma consistente durante suficiente tiempo como para tener línea base estadística (no solo un dashboard puntual).
- [ ] Las metas de calidad/rendimiento se fijan con base en esa línea base, no en números arbitrarios.

---

## 4. Nivel 5 — Optimización

### 4.1 Análisis Causal y Resolución (CAR)
**Exige:** cuando algo falla, se investiga la causa raíz sistemáticamente y se
previene su recurrencia — no solo se corrige el síntoma.
**Con las herramientas actuales:** esta misma sesión es un ejemplo real de la
práctica: el bug de `SmartLLMRouter` (LLM personalizado por tema roto) no solo se
corrigió, se documentó la causa raíz (mismatch de firma de constructor) y se agregó
verificación reproducible (construcción real dentro del contenedor). **Formalizar
este patrón como práctica estándar**, no dejarlo implícito.
**Checklist:**
- [ ] Los incidentes/bugs significativos se documentan con causa raíz, no solo "se arregló".
- [ ] Existe un mecanismo para detectar si el mismo tipo de causa raíz se repite en otro proyecto del portafolio.

### 4.2 Gestión del Desempeño Organizacional (OPM)
**Exige:** mejora continua deliberada de los procesos organizacionales, guiada por datos y objetivos de negocio.
**Checklist:**
- [ ] Existe una revisión periódica (no solo reactiva) de qué tan bien están funcionando los estándares de este documento y del estándar de seguridad, con ajustes reales cuando algo no funciona.

---

## 5. Diagnóstico rápido por proyecto (plantilla)

Para cada proyecto (`consulta-smart`, `idp-smart`, `lexivault-ai`, nuevos), llenar:

| Área de Proceso | Estado | Evidencia | Prioridad de cierre |
|---|---|---|---|
| REQM | [Cumple/Parcial/Falta] | | |
| PP/PMC | | | |
| CM | | | |
| PPQA | | | |
| SAM | | | |
| MA | | | |
| RD/TS/PI/VER/VAL | | | |
| OPF/OPD | | | |
| OT | | | |
| IPM | | | |
| RSKM | | | |
| DAR | | | |
| OPP/QPM | | | |
| CAR | | | |
| OPM | | | |

**Diagnóstico para `consulta-smart`** (actualizado 2026-07-22 noche, tras cerrar dos brechas reales):
- **CM [Cumple, cerrado 2026-07-22 noche]:** código en git correctamente versionado; la brecha real (`chatbot_profiles` sin historial, causante del incidente del tema "general") se cerró con `chatbot_profile_audit_log` (snapshot antes/después, restauración a un clic) — ver `MANUAL_TECNICO_DESARROLLADOR.md` §14.11 y `docs/BITACORA_ANALISIS_CAUSAL.md`. Pendiente: extender el mismo patrón a otras tablas de configuración de negocio si aparecen (hoy solo `chatbot_profiles` lo necesitaba).
- **PPQA [Cumple]:** se ejecutó una ronda real de auditoría con hallazgos [Cierto] y remediación verificada contra el sistema en ejecución.
- **RSKM [Cumple, cerrado 2026-07-22 noche]:** riesgos consolidados en `consulta-smart/docs/REGISTRO_DE_RIESGOS.md` — 8 riesgos abiertos con probabilidad/impacto/plan/disparador de revisión explícitos, más histórico de 7 riesgos cerrados. Antes vivían dispersos en la narrativa de `MANUAL_TECNICO_DESARROLLADOR.md` §8.
- **RD/TS (Nivel 3) [Cumple, cerrado 2026-07-22 noche]:** creados `docs/skills/generacion-servicios-fastapi/SKILL.md` y `docs/skills/generacion-componentes-react/SKILL.md` — equivalentes reales (no genéricos) a los skills Angular/PrimeNG existentes, cada regla extraída de un bug real de esta misma sesión (BOLA, DTOs públicos filtrando secretos, cifrado de secretos, migraciones de esquema, componentes huérfanos, bug de sticky/overflow).
- **CAR [Cumple, cerrado 2026-07-22 noche]:** formalizado en `docs/BITACORA_ANALISIS_CAUSAL.md` (`consulta-smart/docs/`) con 2 incidencias reales documentadas (síntoma, causa raíz, corrección, prevención de recurrencia, evidencia de verificación) — el tema "general" corrupto y el bug de `SmartLLMRouter`.

---

## Procedencia

Este documento traduce el modelo CMMI (áreas de proceso de Niveles 2-5, nomenclatura
clásica de 22 PA) a prácticas verificables usando las herramientas reales de este
portafolio (git, skills de `docs/skills/`, auditorías de `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`,
manuales técnicos por proyecto). No reemplaza una evaluación SCAMPI formal — es el
punto de partida práctico para cerrar brechas antes de, si es la decisión
organizacional, buscar una certificación real.
