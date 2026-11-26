---
name: consolidacion-auditorias-seguridad
description: "Método y scripts para consolidar las auditorías de seguridad de un sistema con varios repositorios (auditoría manual de código, análisis de segundo nivel y reportes de escáneres en SARIF: Semgrep, CodeQL, Trivy, Checkov y otros) en un informe con dictamen, un libro de triage por causa raíz (vulnerabilidad / falso positivo / calidad) con plan de trabajo en horas, y una matriz de seguimiento en Excel con SLA, responsables, criterios de cierre y escalamiento. Úsalo al consolidar una auditoría, cruzar hallazgos de varias fuentes, separar vulnerabilidades reales de falsos positivos y calidad, estimar esfuerzo de corrección, definir SLA o criterios de cierre, verificar el cierre entre dos corridas, o evaluar contra ISO 27001, NIST CSF o CIS Controls. El catálogo de decisiones empieza vacío en cada proyecto."
---

# Consolidación de auditorías de seguridad

Convierte varios insumos de seguridad que se contradicen o se repiten (auditoría manual, análisis de segundo nivel, reportes de escáneres)
en entregables verificables:

1. **Informe** con dictamen por pregunta, todo citado a archivo y sección.
2. **Libro de triage** (.xlsx): cada ocurrencia de los escáneres clasificada como Vulnerabilidad, Falso positivo o Calidad por causa raíz,
   con plan de trabajo en horas y jornadas.
3. **Matriz de seguimiento** (.xlsx) con un registro por hallazgo, responsable, SLA, evidencia de cierre, firma de validación y resumen
   calculado con fórmulas.

Skills que se combinan con esta: `triage-findings` (el método de clasificación en corto), `auditoria-codigo` (produce el `hallazgos.json`
que esta skill consume), `xlsx` (formato y recálculo) y la de documentos de tu agente para el informe. Responsables y escalamiento salen
del organigrama vigente de la organización.

**El catálogo de decisiones es de cada proyecto.** `assets/catalogo_ejemplo.json` es ilustrativo (causas genéricas y un falso positivo
acotado a un archivo); no contiene decisiones de ningún proyecto real. Un falso positivo se decide por repositorio y archivo, nunca se
hereda como regla general.

## Principios que no se negocian

- **Todo citado.** Cada afirmación relevante lleva archivo y sección. Marca `[V]` lo verificado en documentos e `[I]` lo inferido u
  opinado. Si un dato no está, se dice.
- **Nunca reproducir secretos.** Las auditorías y los reportes de escáneres suelen traer tokens y contraseñas en claro. No los copies al
  informe ni a la matriz; reporta que existen, dónde, y recomienda rotar y restringir la distribución del documento fuente.
- **Quien corrige no valida.** La firma de cierre es del responsable de seguridad o de tecnología; el analista prepara la evidencia. Si el
  auditor es también responsable del área que corrige, señálalo como falta de independencia (ISO 27001 A.5.3, A.5.35).
- **Verifica las premisas del encargo.** Fechas, módulos y alcance que da quien pide el trabajo pueden no coincidir con el contenido de
  los archivos. Corrige con evidencia antes de construir encima.
- **La clasificación es del analista, no tuya.** Vulnerabilidad / falso positivo / calidad es un juicio con consecuencias (un falso positivo
  mal cerrado deja un hueco abierto). Aplica el catálogo que exista, deja `SIN CLASIFICAR` lo que no cubra, **propón** la causa raíz con su
  evidencia y regístrala solo con aprobación. Un falso positivo nunca es el valor por defecto de una regla.
- **Medido ≠ supuesto.** En el plan de trabajo solo la columna «Según la herramienta» es una estimación de una fuente (SonarQube o la
  auditoría de código la traen; SARIF no); minutos por unidad, trabajo adicional y reparto entre áreas son supuestos del analista y se
  rotulan así. Nunca presentes horas inventadas como medición.
- **Trabajo en dos fases** cuando se pida: Fase 1 inventario y cruce, detenerse y mostrar resumen; Fase 2 respuestas y entregables.

## Flujo de trabajo

### Paso 1. Extraer los insumos (scripts/extract_inputs.py)

Los archivos pueden no ser lo que dice su extensión (un `.pdf` que es un ZIP de imágenes y texto, un `.docx` que es texto plano).
`python scripts/extract_inputs.py <carpeta_insumos> <carpeta_txt>` detecta el tipo real, extrae el texto completo y deja un `.txt` por
archivo. Revisa el inventario que imprime antes de seguir.

### Paso 2. Inventario por módulo y repositorio

Arma la tabla módulo × insumo (auditoría backend, auditoría frontend, análisis de segundo nivel, escáneres) con la fecha real de cada
documento. Identifica el módulo de cada análisis **por contenido**, no por nombre de archivo: compara encabezados y busca duplicados
(`diff`, `md5sum`). Lista los huecos: módulos sin auditoría de una capa y repositorios que solo cubre un escáner. Un sistema suele ser
**varios repositorios** (backend, frontend, librerías): inclúyelos todos y di cuál falta; un repositorio sin reporte no es un repositorio limpio.

### Paso 3. Normalizar los hallazgos de las herramientas

Todas las fuentes se convierten al formato de `references/formato-hallazgos.md` (una fila por regla × repositorio con todas sus ubicaciones):

```bash
semgrep --config p/security-audit --sarif -o semgrep-back.sarif back/
trivy fs --scanners vuln --format sarif -o trivy-back.sarif back/
python scripts/parse_sarif.py escaneres.json backend=semgrep-back.sarif backend=trivy-back.sarif frontend=semgrep-front.sarif
python scripts/parse_hallazgos.py auditoria-ia.json backend=back/hallazgos.json
```

- `parse_sarif.py` lee cualquier SARIF 2.1.0 (Semgrep, CodeQL, Trivy, Checkov, Bandit, ESLint…). Toma la severidad CVSS cuando la regla la
  publica, el CWE de sus etiquetas y, en dependencias, paquete y versiones del mensaje.
- `parse_hallazgos.py` lee el `hallazgos.json` de `auditoria-codigo`; solo entran los hallazgos `abierto`.
- Una herramienta sin SARIF se integra con un lector que escriba el mismo formato.
- **Cuadra antes de seguir:** cada lector imprime reglas y ocurrencias por archivo; compáralas con el resumen de la propia herramienta.
- **Compara contra el catálogo de reglas del equipo** (`prevencion-hallazgos-seguridad-calidad/references/catalogo-reglas.md`, si existe):
  reglas del reporte que no están en el catálogo y diferencias de severidad.

### Paso 3b. Triage por causa raíz (scripts/triage_report.py, references/triage_catalogo.md)

```bash
python scripts/triage_report.py escaneres.json,auditoria-ia.json catalogo.json libro_triage.xlsx \
  --matriz matriz_escaneres.json --pendientes pendientes.json --titulo SISTEMA --fuente "Semgrep y Trivy, corrida del 24/11"
```

Clasifica cada ocurrencia con el catálogo del analista (parte de `assets/catalogo_ejemplo.json`: las causas genéricas —dependencias con
CVE, accesibilidad, bloqueo optimista, Dockerfile sin `USER`, secretos en configuración— suelen reutilizarse; las específicas no). El libro
trae: **Resumen** (por clasificación, repositorio y severidad), **Cobertura**, **Plan de trabajo** (horas, jornadas y semanas por área, con
supuestos editables en amarillo), **Vulnerabilidades**, **Falsos positivos** (cada uno con su fundamento y cuándo reabrirlo), **Calidad**,
**Versiones desactualizadas** (por CVE y por paquete: una actualización cierra varias), **Detalle** (cada ocurrencia, con su causa raíz
editable) y **Criterios**. Deduplica el mismo hallazgo reportado por varias herramientas en la misma línea.

Después de la corrida:
- Lee `pendientes.json`: los grupos `SIN CLASIFICAR` con evidencia, ubicaciones de muestra y cómo se clasificó **esa misma regla** en otros
  lugares (un indicio, no una decisión). Para cada grupo (repositorio × regla) aplica las cuatro preguntas de `references/triage_catalogo.md`,
  **propón** causa raíz y certeza al analista y agrégala al catálogo solo si la aprueba. Vuelve a correr.
- Comprueba que las ocurrencias totales coincidan con las que declaran las fuentes (el script lo imprime) y que `SIN CLASIFICAR` quede en 0
  o explícitamente pendiente.
- Dilo en el informe: lo medido (conteos, severidades, ubicaciones) frente al criterio del analista (clasificación, fundamentos, horas).

### Paso 4. Parsear auditorías en Markdown (scripts/parse_auditoria_md.py)

`python scripts/parse_auditoria_md.py <dir_md> auditoria.json` extrae hallazgos de reportes Markdown con encabezados `### CRIT-01 …` /
`MED-` / `MEN-` / `MIN-` (backend) y secciones «Clasificación de hallazgos» o «### Hallazgo N» (frontend). Revisa también las secciones de
«Riesgos de seguridad» y «Seguridad»: suelen traer riesgos sin número propio que hay que registrar como hallazgos adicionales.

Clasifica cada hallazgo por **tipo**: Seguridad, Rendimiento, Arquitectura, Calidad, Funcional (y en los escáneres además Dependencias,
CI/CD, IaC, Accesibilidad). Solo los de seguridad se cruzan contra los escáneres.

### Paso 5. Cruce auditoría ↔ escáneres

Para cada hallazgo de seguridad de la auditoría asigna:

| Clase | Significado | Cómo se decide |
| --- | --- | --- |
| a | Un escáner lo detectó | Misma regla o CWE y mismo archivo/línea en los hallazgos normalizados |
| b | Hay regla aplicable pero no aparece | La regla existe en la herramienta; el archivo no está entre las ubicaciones |
| c | Lo detectó otra herramienta | Otra fuente distinta de la que se esperaba (SonarQube, ZAP, revisión manual) |
| d | Sin cobertura | Ninguna regla de ninguna herramienta aplica |

Para los (b), argumenta la causa (ya corregido, cambió el código o falso negativo). Una señal útil: si muchas líneas citadas por la
auditoría coinciden exactamente con las del escáner semanas después, el código cambió poco y el (b) es probablemente falso negativo. Con
ubicaciones `truncado` no se puede descartar un (b).

Haz el **cruce inverso**: críticos y altos de los escáneres sin equivalente en la auditoría. Concluye con las reglas que les faltan a las
herramientas (es la lista para pedir reglas nuevas o configurar las existentes).

### Paso 6. Evaluar análisis de segundo nivel

Usa `references/checklist_analisis.md`. Lo esencial: módulo correcto, fidelidad de líneas/conteos/severidades, omisiones, CVE verificados con
fuente (los hallazgos de código propio llevan CWE, no CVE), CWE y controles ISO de la versión correcta (2022, no 2013), mitigaciones viables,
supuestos de infraestructura marcados como no verificados, y si el autor se quedó en gestión y validación o definió correcciones que
corresponden a los equipos.

### Paso 7. Construir la matriz (scripts/build_matrix_xlsx.py)

1. Une auditoría y escáneres en un JSON con el esquema de `references/matriz_schema.md`. Los registros de los escáneres salen hechos de
   `triage_report.py --matriz` (uno por regla × repositorio × causa raíz, IDs `C-<repo>-<nn>`); los de la auditoría llevan
   `Y-<módulo>-<B|F>-<id original>`.
2. Marca `Origen` = Ambos cuando la clase es a o c. `Principal = No` solo en duplicados exactos (mismo defecto, mismo componente): el
   triage ya marca los que varias herramientas reportan en la misma línea; revisa los de la auditoría.
3. Severidad consolidada = la mayor de las fuentes, salvo ajustes justificados en Notas (falso positivo declarado → Informativa, como hace
   el triage; MD5 usado como checksum, etc.).
4. Asigna el área responsable con el organigrama vigente: el triage propone la del catálogo; revísala. Código → Desarrollo; consultas,
   índices, restricciones y pool → Arquitectura y BD; repositorios, pipelines, servidores, secretos en servidores, respaldos, monitoreo,
   Kubernetes → Infraestructura (marcar «confirmar»). Usa `Apoyo` para lo compartido.
5. Prepara `params.json` (fecha base, SLAs, áreas y escalamiento, firmas). Plantilla en `assets/params_plantilla.json`.
6. Ejecuta `python scripts/build_matrix_xlsx.py matriz.json params.json salida.xlsx [hojas_extra.json]` y luego el `recalc.py` de la skill
   `xlsx`. Debe dar cero errores. (El libro de triage ya trae sus valores calculados.)
7. Verifica con `load_workbook(data_only=True)` que los totales del Resumen coinciden con las cifras del informe.

### Paso 8. Modelo de seguimiento (SLAs, cierre, escalamiento)

Parte de `assets/params_plantilla.json` (SLAs en dos tiempos ya cargados; los titulares se llenan desde el organigrama).

**Verificar un cierre:** `python scripts/comparar_corridas.py antes.json despues.json --salida cierre.json` clasifica cada ocurrencia
(repositorio, regla, archivo, línea) como resuelta, nueva o persistente. Las dos corridas deben ser de las mismas herramientas con las mismas
reglas: si cambió la configuración, «desapareció» no significa «se corrigió». Concluye solo donde las ubicaciones están completas en ambas
corridas; si las líneas se movieron, lo marca *posible desplazamiento* (mirar el código) y lo `truncado` como *no concluyente*. Es la evidencia
del re-escaneo, no sustituye la prueba funcional multirol.

Usa los SLAs en dos tiempos de `references/marcos_y_slas.md` (contención corta, corrección en 15/30/90/180 días) y justifica cualquier cambio.
Criterios de cierre por tipo: MR con revisor distinto del autor + re-escaneo + prueba autenticada multirol; para secretos, rotación + purga del
historial + prueba de que la credencial anterior ya no autentica. El escalamiento sigue la línea jerárquica real del área que corrige, no la de
quien supervisa la seguridad.

### Paso 9. Infraestructura y cumplimiento

- Extrae todo lo que toca servidores, contenedores, BD, caché, red, secretos, CI/CD, respaldos y monitoreo; sepáralo del código; asigna
  responsable principal y de apoyo; lista la información de inventario que falta para validarlo.
- Compara contra las funciones de seguridad que la organización tenga documentadas y contra ISO 27001:2022, NIST CSF 2.0 y CIS v8
  (`references/marcos_y_slas.md`). Evalúa siempre independencia de la auditoría, formalidad del rol de seguridad y existencia de inventario
  de infraestructura.

### Paso 10. Entregables

- **Informe** (documento): resumen ejecutivo con tabla de dictamen por pregunta y acciones inmediatas; una sección por pregunta; anexo de
  insumos y fuentes externas.
- **Libro de triage** (Paso 3b) y **Excel de matriz:** hojas Léeme, Resumen, Matriz, Cruce, Cuadre de escáneres, Evaluación de analistas,
  Infraestructura y Parámetros. Las celdas editables van en amarillo.
- Cierra con 2–4 líneas: qué se entregó y qué queda abierto (incluye siempre cuántas ocurrencias quedaron `SIN CLASIFICAR` y qué cobertura no
  se pudo verificar). Sin repetir el informe.

## Dependencias

Python 3.10+, `xlsxwriter` (libro de triage) y `openpyxl` (matriz): `pip install xlsxwriter openpyxl`. Para extraer documentos:
`pdftotext` (poppler) y `pandoc`. Los escáneres no son dependencia: basta su SARIF. Los scripts se ejecutan desde la carpeta de la skill
(`python scripts/…`).

## Errores frecuentes que esta skill evita

- Confiar en el nombre de archivo para saber qué módulo analiza.
- Tomar el total de un escáner como «vulnerabilidades reales»: incluye accesibilidad, concurrencia y calidad. El triage los separa.
- Contar «ubicaciones» como archivos: son pares archivo:línea.
- Dar por resuelto lo que «desapareció» cuando la fuente recortó su lista, el código solo movió líneas o cambió la configuración del escáner.
- Cerrar como falso positivo por regla completa en vez de por archivo y condición.
- Adoptar SLAs de 24 h para críticos cuando hay decenas concentrados en un mismo patrón: vencen el primer día y dejan de servir para gestionar.
- Dejar que el área que corrige firme su propio cierre.
- Asignar CVE a defectos de código propio, o citar controles ISO 27001:2013 como 2022.

## Origen

El método (clasificación por causa raíz con catálogo del analista, cuadre contra lo declarado por cada fuente, SLA en dos tiempos y
verificación de cierre entre corridas) se construyó consolidando auditorías reales de sistemas con varios repositorios; los scripts y
este texto son propios del framework. Los marcos citados (ISO/IEC 27001:2022, NIST CSF 2.0, CIS Controls v8, CISA BOD 19-02, SARIF 2.1.0
de OASIS) se usan como referencia pública.
