# Estándar Universal de Prácticas CMMI — Setag

**Alcance: universal / multi-proyecto.** Igual que `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` (seguridad), este documento es portable: aplica a cualquier
proyecto de Setag, sin importar el stack. Se copia tal cual a cada repositorio o se referencia desde su `CLAUDE.md`/`AGENTS.md`.

**Alcance del documento:** traduce las áreas de proceso de los niveles de madurez 2 a 5 en prácticas concretas y verificables con las herramientas que
los equipos ya usan (git, revisión de código, documentación colocalizada, auditorías de seguridad). **No sustituye** una evaluación formal SCAMPI por
evaluadores certificados, que es lo único que otorga un nivel de madurez; una certificación formal es una decisión organizacional aparte, con costo y
tiempo propios.

**Nomenclatura:** las siglas de abajo (REQM, PP/PMC, CM, PPQA…) son las áreas de proceso clásicas. Si Setag decide evaluarse contra el modelo vigente de
ISACA (CMMI V3.0), las áreas de práctica tienen otros nombres y otra agrupación: antes de usar este documento como evidencia de una evaluación, hay que
mapearlo a ese modelo; aquí no se hace ese mapeo.

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
`docs/requirements/` (o la carpeta equivalente del proyecto) como
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
**Con las herramientas actuales:** git para código. La brecha típica no está en el código sino en la
**configuración de negocio guardada en base de datos** (perfiles, temas, parámetros): si no tiene versión ni bitácora de cambios, un valor corrupto no se
puede revertir. Esa configuración necesita su propia bitácora (antes/después y quién cambió).
**Checklist:**
- [ ] Todo el código está en git con historial real (no solo el estado final).
- [ ] La configuración de negocio crítica (no solo código) tiene versión/historial (p. ej. tabla de auditoría con snapshot antes/después y restauración).
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
**Con las herramientas actuales:** inventario de API keys/proveedores por proyecto; un gestor
de secretos para las credenciales (nunca en el repositorio).
**Checklist:**
- [ ] Existe un inventario actualizado de qué servicios externos usa cada proyecto y con qué credenciales.
- [ ] Hay un plan de respaldo si un proveedor externo falla (p. ej. un proveedor alterno o un modo degradado documentado).

### 1.6 Medición y Análisis (MA)
**Exige:** métricas objetivas del proceso y del producto, usadas realmente para decidir.
**Con las herramientas actuales:** un panel de observabilidad por proyecto (p. ej. tasa de errores,
satisfacción de usuarios, proveedores activos) es un ejemplo de esta práctica; el patrón se replica entre proyectos.
**Checklist:**
- [ ] Cada proyecto define al menos 2-3 métricas objetivas de calidad/uso.
- [ ] Esas métricas se revisan periódicamente, no solo cuando algo falla.

---

## 2. Nivel 3 — Definido (estandarizado entre proyectos)

### 2.1 Desarrollo/Gestión de Requisitos avanzada (RD), Solución Técnica (TS), Integración (PI), Verificación (VER), Validación (VAL)
**Exige:** procesos de ingeniería estandarizados y reutilizables entre proyectos, no
reinventados cada vez.
**Con las herramientas actuales:** las guías de `docs/skills/` (generación de servicios, DTOs,
componentes, pruebas) son exactamente esto: estándares de ingeniería reutilizables entre proyectos. Cada stack que se use necesita su equivalente; un stack
sin guía propia es una brecha.
**Checklist:**
- [ ] Existe una guía de "cómo generar un servicio/componente/DTO nuevo" por cada stack tecnológico que use la organización.
- [ ] Los criterios de aceptación (pruebas, validación) están estandarizados, no a discreción de cada desarrollador.

### 2.2 Enfoque y Definición de Procesos Organizacionales (OPF, OPD)
**Exige:** la organización (no cada proyecto por separado) define y mejora sus
procesos estándar.
**Con las herramientas actuales:** un `docs/` compartido entre proyectos (este framework, que se
distribuye con `scripts/distribute_framework.py` y se comprueba con `--check`) es el lugar correcto para los estándares organizacionales; este mismo
documento y `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md` son ejemplos.
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
- [ ] Existe un mecanismo para detectar si el mismo tipo de causa raíz se repite en otro proyecto de la organización.

### 4.2 Gestión del Desempeño Organizacional (OPM)
**Exige:** mejora continua deliberada de los procesos organizacionales, guiada por datos y objetivos de negocio.
**Checklist:**
- [ ] Existe una revisión periódica (no solo reactiva) de qué tan bien están funcionando los estándares de este documento y del estándar de seguridad, con ajustes reales cuando algo no funciona.

---

## 5. Diagnóstico rápido por proyecto (plantilla)

Para cada proyecto, llenar (con evidencia verificable; sin evidencia es «Falta», no «Parcial»):

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

---

## Procedencia

Este documento traduce el modelo CMMI (áreas de proceso de los niveles 2 a 5, nomenclatura clásica de 22 áreas) a prácticas verificables usando
herramientas comunes (git, guías de `docs/skills/`, auditorías de `ESTANDAR_MAESTRO_AUDITORIA_UNIVERSAL.md`, manuales técnicos por proyecto). No reemplaza
una evaluación SCAMPI formal: es el punto de partida práctico para cerrar brechas antes de, si es la decisión organizacional, buscar una certificación real.
