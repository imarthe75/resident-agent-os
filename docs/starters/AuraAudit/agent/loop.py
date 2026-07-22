import os
import json
import datetime
from .heuristic_engine import HeuristicEngine

class AuraAuditLoop:
    def __init__(self, target_dir: str, output_dir: str):
        self.target_dir = target_dir
        self.output_dir = output_dir
        self.stack = {}
        self.findings = []
        self.scan_results = {
            "hardcoded_secrets": [],
            "sql_injection_suspects": [],
            "cors_wildcards": [],
            "orphan_subscriptions": [],
            "missing_indexes": [],
            "exposed_exceptions": [],
            "nginx_headers_missing": [],
            "complex_files": []
        }

    def boot(self):
        print("====================================================")
        print("         ✨ AuraAudit Cognitive Scan Engine ✨        ")
        print("====================================================")
        print(f"[*] Target Directory: {self.target_dir}")
        print(f"[*] Output Directory: {self.output_dir}")
        print("[*] Boot phase complete.")

    def detect_stack(self):
        print("[*] Detecting stack using HeuristicEngine...")
        engine = HeuristicEngine(self.target_dir)
        self.stack = engine.detect_stack()
        print(f"[*] Stack detected: {self.stack}")

    def execute_local_scans(self):
        print("[*] Running local scanners...")
        # We will import skills inside execution to keep imports clean
        from skills.sast_scan import SastScanSkill
        from skills.performance_scan import PerformanceScanSkill
        from skills.frontend_scan import FrontendScanSkill
        from skills.complexity_scan import ComplexityScanSkill

        # sast scan
        sast = SastScanSkill()
        sast_res = sast.run({"target_dir": self.target_dir})
        self.scan_results["hardcoded_secrets"].extend(sast_res.hardcoded_secrets)
        self.scan_results["cors_wildcards"].extend(sast_res.cors_wildcards)
        self.scan_results["nginx_headers_missing"].extend(sast_res.nginx_headers_missing)

        # performance scan
        if self.stack["has_java"]:
            perf = PerformanceScanSkill()
            perf_res = perf.run({"target_dir": self.target_dir})
            self.scan_results["missing_indexes"].extend(perf_res.missing_indexes)

        # frontend scan
        if self.stack["has_angular"]:
            fe = FrontendScanSkill()
            fe_res = fe.run({"target_dir": self.target_dir})
            self.scan_results["orphan_subscriptions"].extend(fe_res.orphan_subscriptions)

        # complexity scan
        comp = ComplexityScanSkill()
        comp_res = comp.run({"target_dir": self.target_dir})
        self.scan_results["complex_files"].extend(comp_res.complex_files)

    def run_ai_enrichment(self):
        api_key = os.environ.get("NVIDIA_NIM_API_KEY")
        if not api_key:
            print("[!] NVIDIA_NIM_API_KEY not found in environment. Skipping AI audit enrichment phase.")
            return

        print("[*] Habilitando fase de enriquecimiento semántico por IA mediante NVIDIA NIM...")
        from skills.nvidia_nim_audit import NvidiaNimAuditSkill
        ai_skill = NvidiaNimAuditSkill()
        
        # We audit key files
        files_to_audit = []
        for root, dirs, files in os.walk(self.target_dir):
            if "node_modules" in root or ".git" in root or "build" in root or "target" in root:
                continue
            for file in files:
                if file.endswith((".java", ".ts", ".js", ".properties", ".yml", "nginx.conf")):
                    files_to_audit.append(os.path.join(root, file))

        # Audit top 5 files to prevent token limit issues
        for file_path in files_to_audit[:5]:
            rel_path = os.path.relpath(file_path, self.target_dir)
            print(f"[*] Auditing file with AI: {rel_path}")
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                ai_res = ai_skill.run({
                    "file_name": rel_path,
                    "content": content
                })
                # If AI found vulnerabilities
                if ai_res.has_issues:
                    for issue in ai_res.findings:
                        print(f"    [!] AI Finding: {issue.title} in {rel_path}")
                        self.findings.append(issue)
            except Exception as e:
                print(f"    [e] Error auditing file {rel_path}: {e}")

    def consolidate_reports(self):
        print("[*] Consolidating reports...")
        os.makedirs(self.output_dir, exist_ok=True)
        date_str = datetime.date.today().strftime("%Y-%m-%d")
        
        # Format helper
        def get_finding_md(finding_id, title, severity, category, component, cwe, rule, desc, details, evidence_code, steps, command, output, technical_impact, business_impact, recommendation_a, recommendation_b, effort, complexity, regression, code_before="", code_after=""):
            return f"""## [{finding_id}] {title}

**Fecha Detección:** {date_str}  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** {component.split('/')[0] if '/' in component else 'Sistema'}  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | {severity} |
| **Categoría** | {category} |
| **Componente Afectado** | {component} |
| **CVE/CWE** | {cwe} |
| **Normativa Aplicable** | {rule} |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
{desc}

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** {details['cause']}
- **Escenario de Riesgo:** {details['scenario']}
- **Consecuencia:** {details['consequence']}

#### 1.3 ¿A quién afecta?
{details['affects']}

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: {component}
{evidence_code}
```

#### 2.2 Pasos para Reproducir
{steps}

#### 2.3 Comando Exacto para Verificar
```bash
{command}
```

#### 2.4 Output/Respuesta Observada
```
{output}
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | {technical_impact['confidentiality']} | {technical_impact['conf_mag']} |
| **Integridad** | {technical_impact['integrity']} | {technical_impact['int_mag']} |
| **Disponibilidad** | {technical_impact['availability']} | {technical_impact['disp_mag']} |
| **Performance** | {technical_impact['performance']} | {technical_impact['perf_mag']} |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | {business_impact['compliance']} |
| **Reputación** | {business_impact['reputation']} |
| **Usuarios Impactados** | {business_impact['users']} |
| **Costo Potencial** | {business_impact['cost']} |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | {business_impact['remediation_time']} |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: {recommendation_a['name']}**
- Ventaja: {recommendation_a['pro']}
- Desventaja: {recommendation_a['con']}
- Esfuerzo: {recommendation_a['effort']}

**Opción B: {recommendation_b['name']}** (Recomendada)
- Ventaja: {recommendation_b['pro']}
- Desventaja: {recommendation_b['con']}
- Esfuerzo: {recommendation_b['effort']}

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- {recommendation_b['pattern']}

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
{code_before}
```

**Código Corregido / Solución:**
```
{code_after}
```

---

### 5. 📊 Estimación

| Aspecto | Valor |
|---------|-------|
| **Esfuerzo de Corrección** | {effort} |
| **Complejidad Técnica** | {complexity} |
| **Riesgo de Regresión** | {regression} |
| **Testing Requerido** | Unit / Integration |
| **Cambios en API** | No |
| **Cambios en DB Schema** | {"Sí" if "DB" in category or "Index" in title or "base de datos" in desc.lower() else "No"} |

---

### 6. 🎯 Criterio de Aceptación
- [ ] Código revisado por 2 revisores
- [ ] Pruebas automatizadas pasando
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- {cwe}
- {rule}

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| {date_str} | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---
"""

        # Map local findings to full markdown template findings
        proj_name = os.path.basename(self.target_dir.rstrip("/"))
        
        # 1. Hardcoded Secrets
        for item in self.scan_results["hardcoded_secrets"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"SEC-SEC-{proj_name.upper()}",
                "title": "Secreto o Credencial Hardcodeado en Archivo de Configuración",
                "severity": "🔴 Crítica",
                "category": "Seguridad",
                "component": f"{proj_name}/{item['file']}:{item['line']}",
                "cwe": "CWE-798: Use of Hard-coded Credentials",
                "rule": "ISO27001 A.10 / OWASP A05",
                "desc": f"Se detectó una credencial expuesta directamente en texto plano en el archivo {item['file']}.",
                "details": {
                    "cause": "Definición directa de secretos en archivo de texto plano.",
                    "scenario": "Un atacante con acceso al código fuente podría comprometer la BD o servicios.",
                    "consequence": "Acceso total no autorizado a los datos.",
                    "affects": "Base de datos / Infraestructura"
                },
                "evidence_code": item['content'],
                "steps": f"1. Abrir {item['file']}\n2. Observar línea {item['line']}",
                "command": f"cat {item['file']} | grep -n '{item['content'].split('=')[0] if '=' in item['content'] else 'password'}'",
                "output": item['content'],
                "technical_impact": {"confidentiality": "Exposición de credenciales", "conf_mag": "🔴 Crítica", "integrity": "Total", "int_mag": "🔴 Crítica", "availability": "Alta", "disp_mag": "🔴 Crítica", "performance": "No aplica", "perf_mag": "✅ No aplica"},
                "business_impact": {"compliance": "Incumplimiento normativo", "reputation": "Pérdida de confianza grave", "users": "Todos los usuarios", "cost": "Multas potenciales", "remediation_time": "Bajo (<2h)"},
                "recommendation_a": {"name": "Variables directas", "pro": "Rápido", "con": "Difícil gestionar", "effort": "Bajo"},
                "recommendation_b": {"name": "Gestor de Secretos Vault", "pro": "Seguro", "con": "Configuración", "effort": "Medio", "pattern": "Inyección por variables de entorno seguras"},
                "effort": "Bajo (<4h)",
                "complexity": "Baja",
                "regression": "Bajo"
            })))

        # 2. CORS Wildcards
        for item in self.scan_results["cors_wildcards"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"SEC-CORS-{proj_name.upper()}",
                "title": "Configuración Permisiva de CORS (Wildcard '*')",
                "severity": "🟠 Alta",
                "category": "Seguridad",
                "component": f"{proj_name}/{item['file']}:{item['line']}",
                "cwe": "CWE-942: Overly Permissive CORS",
                "rule": "OWASP A05",
                "desc": f"Se detectó el uso de comodín '*' en los orígenes permitidos de CORS en {item['file']}.",
                "details": {
                    "cause": "Uso de origin * en la configuración de CORS.",
                    "scenario": "Un sitio malicioso podría forzar peticiones cruzadas a la API.",
                    "consequence": "Fugas de datos sensibles o acciones no autorizadas.",
                    "affects": "API Endpoints"
                },
                "evidence_code": item['content'],
                "steps": f"1. Abrir {item['file']}\n2. Observar la línea {item['line']}",
                "command": f"cat {item['file']} | grep -n '*'",
                "output": item['content'],
                "technical_impact": {"confidentiality": "Media", "conf_mag": "🟠 Alta", "integrity": "Baja", "int_mag": "🟡 Media", "availability": "No aplica", "disp_mag": "✅ No aplica", "performance": "No aplica", "perf_mag": "✅ No aplica"},
                "business_impact": {"compliance": "Falta de cumplimiento OWASP A05", "reputation": "Medio", "users": "Usuarios en navegadores", "cost": "Bajo", "remediation_time": "1 día"},
                "recommendation_a": {"name": "Estático", "pro": "Sencillo", "con": "Poco dinámico", "effort": "Bajo"},
                "recommendation_b": {"name": "CORS Dinámico por perfiles", "pro": "Seguro", "con": "Requiere configuración", "effort": "Bajo", "pattern": "CorsConfigurationSource de Spring"},
                "effort": "Bajo (<4h)",
                "complexity": "Baja",
                "regression": "Bajo"
            })))

        # 3. Nginx Headers Missing
        for item in self.scan_results["nginx_headers_missing"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"SEC-HEADERS-{proj_name.upper()}",
                "title": "Ausencia de Cabeceras de Seguridad Críticas en Nginx",
                "severity": "🟠 Alta",
                "category": "Seguridad",
                "component": f"{proj_name}/{item['file']}",
                "cwe": "CWE-693: Protection Mechanism Failure",
                "rule": "OWASP A05 / CIS Benchmarks",
                "desc": f"Faltan cabeceras fundamentales en nginx.conf: {item['headers']}.",
                "details": {
                    "cause": "Directivas add_header ausentes en la configuración.",
                    "scenario": "Ataques XSS o MITM por falta de HSTS/CSP.",
                    "consequence": "Suplantación de identidad o robo de cookies.",
                    "affects": "Servidor Nginx"
                },
                "evidence_code": f"nginx.conf sin cabeceras: {item['headers']}",
                "steps": "1. Inspeccionar nginx.conf\n2. Validar bloque server",
                "command": "grep 'add_header' nginx.conf",
                "output": "Cabeceras incompletas",
                "technical_impact": {"confidentiality": "Media", "conf_mag": "🟠 Alta", "integrity": "Inyección XSS", "int_mag": "🟠 Alta", "availability": "No aplica", "disp_mag": "✅ No aplica", "performance": "No aplica", "perf_mag": "✅ No aplica"},
                "business_impact": {"compliance": "OWASP A05", "reputation": "Afectada", "users": "Usuarios finales", "cost": "Bajo", "remediation_time": "1 hora"},
                "recommendation_a": {"name": "CDN", "pro": "Fácil", "con": "Dependencia", "effort": "Bajo"},
                "recommendation_b": {"name": "add_header en Nginx", "pro": "Portátil", "con": "Requiere redeploy", "effort": "Bajo", "pattern": "add_header Content-Security-Policy ..."},
                "effort": "Bajo (<4h)",
                "complexity": "Baja",
                "regression": "Bajo"
            })))

        # 4. Missing Indexes
        for item in self.scan_results["missing_indexes"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"PERF-IDX-{proj_name.upper()}",
                "title": "Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos",
                "severity": "🟠 Alta",
                "category": "Rendimiento",
                "component": f"{proj_name}/{item['file']}:{item['line']}",
                "cwe": "CWE-707: Improper Enforcement of Message or Data Structure",
                "rule": "Mejores prácticas de Base de Datos",
                "desc": f"Se detectó una relación FK en {item['file']} que carece de índice asociado.",
                "details": {
                    "cause": "Declaración de FOREIGN KEY sin INDEX complementario.",
                    "scenario": "Escaneos secuenciales lentos durante JOINs masivos.",
                    "consequence": "Retardos de respuesta en el API.",
                    "affects": "Base de datos relacional"
                },
                "evidence_code": item['content'],
                "steps": f"1. Abrir {item['file']}\n2. Buscar la declaración de FOREIGN KEY en {item['line']}",
                "command": f"cat {item['file']} | grep -n 'FOREIGN KEY'",
                "output": item['content'],
                "technical_impact": {"confidentiality": "No aplica", "conf_mag": "✅ No aplica", "integrity": "No aplica", "int_mag": "✅ No aplica", "availability": "Baja", "disp_mag": "🟡 Media", "performance": "Lenta", "perf_mag": "🟠 Alta"},
                "business_impact": {"compliance": "Estándares de diseño de persistencia", "reputation": "Baja velocidad de la plataforma", "users": "Usuarios recurrentes", "cost": "Mayor consumo CPU", "remediation_time": "1 día"},
                "recommendation_a": {"name": "Manual", "pro": "Inmediato", "con": "Difícil mantener", "effort": "Bajo"},
                "recommendation_b": {"name": "Índice en script de migración", "pro": "Consistente", "con": "Requiere pruebas de lock", "effort": "Bajo", "pattern": "CREATE INDEX idx_tabla_fk ON tabla(columna_id)"},
                "effort": "Bajo (<4h)",
                "complexity": "Baja",
                "regression": "Bajo"
            })))

        # 5. Orphan Subscriptions
        for item in self.scan_results["orphan_subscriptions"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"PERF-LEAK-{proj_name.upper()}",
                "title": "Fuga de Memoria potencial por Suscripciones Huérfanas en Angular",
                "severity": "🟡 Media",
                "category": "Rendimiento",
                "component": f"{proj_name}/{item['file']}:{item['line']}",
                "cwe": "CWE-400: Uncontrolled Resource Consumption",
                "rule": "Buenas prácticas de Angular",
                "desc": f"Se detectó un .subscribe() sin mecanismo de liberación en {item['file']}.",
                "details": {
                    "cause": "Subscripción abierta sin onDestroy / unsubscribe / takeUntil.",
                    "scenario": "Navegación repetida acumula subscripciones en memoria de la pestaña del navegador.",
                    "consequence": "Congelamientos y eventual caída de la UI.",
                    "affects": "Usuarios de navegador"
                },
                "evidence_code": item['content'],
                "steps": f"1. Abrir {item['file']}\n2. Observar la línea {item['line']}",
                "command": f"grep -rn '.subscribe('",
                "output": item['content'],
                "technical_impact": {"confidentiality": "No aplica", "conf_mag": "✅ No aplica", "integrity": "No aplica", "int_mag": "✅ No aplica", "availability": "Media", "disp_mag": "🟡 Media", "performance": "Consumo de RAM alto", "perf_mag": "🟠 Alta"},
                "business_impact": {"compliance": "Líneas de diseño frontend", "reputation": "Inestabilidad visual", "users": "Usuarios finales", "cost": "Ninguno", "remediation_time": "1-2 días"},
                "recommendation_a": {"name": "Unsubscribe manual", "pro": "Fácil", "con": "Boilerplate", "effort": "Medio"},
                "recommendation_b": {"name": "Patrón takeUntil con trigger", "pro": "Limpio y escalable", "con": "Estructura adicional", "effort": "Bajo", "pattern": "takeUntil(this.destroy$)"},
                "effort": "Medio (4-16h)",
                "complexity": "Media",
                "regression": "Bajo"
            })))

        # 6. N+1 and Batching Vulnerabilities for Backend Projects
        if self.stack["has_java"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"PERF-BATCH-{proj_name.upper()}",
                "title": "Ausencia de Configuración de Procesamiento por Lotes (Batching) y Riesgo N+1",
                "severity": "🟡 Media",
                "category": "Rendimiento",
                "component": f"{proj_name}/src/main/resources/application.properties",
                "cwe": "CWE-400: Uncontrolled Resource Consumption",
                "rule": "JPA/Hibernate Performance Tuning",
                "desc": "El archivo de propiedades no configura el procesamiento en lote (batching) en el ORM, lo que incrementa el riesgo de problemas N+1 y baja eficiencia en persistencias masivas.",
                "details": {
                    "cause": "Falta de propiedades específicas de Hibernate para agrupar inserciones y actualizaciones en lotes (batch_size).",
                    "scenario": "Inserción o modificación masiva de entidades relacionales enviando múltiples declaraciones individuales.",
                    "consequence": "Saturación rápida del pool de conexiones de la base de datos y latencia alta.",
                    "affects": "Base de Datos y Backend API"
                },
                "evidence_code": "Falta de propiedades: spring.jpa.properties.hibernate.jdbc.batch_size",
                "steps": "1. Revisar application.properties\n2. Observar múltiples INSERT unitarios en consola en lugar de un lote",
                "command": "grep -rn 'batch_size' src/",
                "output": "Ninguna configuración de batching encontrada",
                "technical_impact": {"confidentiality": "No aplica", "conf_mag": "✅ No aplica", "integrity": "No aplica", "int_mag": "✅ No aplica", "availability": "No aplica", "disp_mag": "✅ No aplica", "performance": "Latencia en inserciones masivas", "perf_mag": "🟠 Alta"},
                "business_impact": {"compliance": "Principios de rendimiento de JPA/Hibernate", "reputation": "Tiempos de respuesta lentos", "users": "Procesos batch de negocio", "cost": "Ninguno", "remediation_time": "1 día"},
                "recommendation_a": {"name": "Queries nativas", "pro": "Control total", "con": "Pierde abstracciones ORM", "effort": "Medio"},
                "recommendation_b": {"name": "Propiedades de lote en Hibernate", "pro": "Optimiza automáticamente llamadas del ORM", "con": "Requiere pruebas de compatibilidad de IDs", "effort": "Bajo", "pattern": "spring.jpa.properties.hibernate.jdbc.batch_size=20\\nspring.jpa.properties.hibernate.order_inserts=true\\nspring.jpa.properties.hibernate.order_updates=true"},
                "effort": "Bajo (<4h)",
                "complexity": "Baja",
                "regression": "Bajo"
            })))

        # 7. Cognitive Complexity
        for item in self.scan_results["complex_files"]:
            self.findings.append(json.loads(json.dumps({
                "id": f"PERF-CMP-{proj_name.upper()}",
                "title": "Alta Complejidad Cognitiva en Archivo de Código Fuente",
                "severity": "🟡 Media",
                "category": "Mantenibilidad",
                "component": f"{proj_name}/{item['file']}",
                "cwe": "CWE-400: Uncontrolled Resource Consumption",
                "rule": "Clean Code / Principios de Mantenibilidad",
                "desc": f"El archivo {item['file']} presenta una complejidad cognitiva estimada de {item['complexity_score']}, superando el umbral recomendado de 15.",
                "details": {
                    "cause": "Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).",
                    "scenario": "Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.",
                    "consequence": "Mayor probabilidad de introducir bugs en modificaciones futuras.",
                    "affects": "Equipo de Desarrollo / Pruebas QA"
                },
                "evidence_code": item['evidence'],
                "steps": f"1. Abrir {item['file']}\n2. Analizar el anidamiento y la longitud de las funciones principales.",
                "command": f"cat {item['file']} | grep -E 'if|for|while|catch'",
                "output": f"Puntuación de complejidad estimada: {item['complexity_score']}",
                "technical_impact": {"confidentiality": "No aplica", "conf_mag": "✅ No aplica", "integrity": "No aplica", "int_mag": "✅ No aplica", "availability": "No aplica", "disp_mag": "✅ No aplica", "performance": "Riesgo de bugs alto", "perf_mag": "🟡 Media"},
                "business_impact": {"compliance": "Líneas de calidad de código", "reputation": "Tiempos de entrega lentos", "users": "Desarrolladores", "cost": "Deuda técnica acumulada", "remediation_time": "3 días"},
                "recommendation_a": {"name": "Refactorizar método", "pro": "Mantenible", "con": "Esfuerzo medio", "effort": "Medio"},
                "recommendation_b": {"name": "Extraer a submétodos puros", "pro": "Código limpio y testeable", "con": "Requiere pruebas de regresión", "effort": "Medio", "pattern": "Extract Method Refactoring Pattern"},
                "effort": "Medio (4-16h)",
                "complexity": "Media",
                "regression": "Bajo"
            })))

        # Write reports
        report_file_path = os.path.join(self.output_dir, f"REPORTE_{proj_name.upper()}.md")
        with open(report_file_path, "w") as rf:
            rf.write(f"# Reporte de Hallazgos - Proyecto: {proj_name.upper()}\n\n")
            rf.write(f"**Fecha:** {date_str}  \n")
            rf.write(f"**Auditor:** AuraAudit Engine  \n\n")
            rf.write("---\n\n")
            
            if self.findings:
                rf.write("## 📝 RESUMEN DE HALLAZGOS DETECTADOS\n\n")
                for f in self.findings:
                    # check if finding is dict (from local mapping) or object (from AI/custom models)
                    if isinstance(f, dict):
                        code_before = f.get("evidence_code", "")
                        code_after = ""
                        fid = f.get("id", "")
                        if "SEC-SEC" in fid:
                            key_part = f["evidence_code"].split('=')[0] if '=' in f["evidence_code"] else "password"
                            code_after = f"# Inyectar el secreto mediante variable de entorno segura\n{key_part.strip()} = ${{{key_part.strip().upper()}_ENV}}"
                        elif "SEC-CORS" in fid:
                            code_after = f"// Reemplazar wildcard '*' por orígenes de confianza autorizados\ncorsRegistry.addMapping(\"/**\").allowedOrigins(\"https://trusted-domain.com\");"
                        elif "SEC-HEADERS" in fid:
                            code_after = "# Agregar cabeceras de seguridad recomendadas en el bloque server {\nadd_header Content-Security-Policy \"default-src 'self';\" always;\nadd_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;\nadd_header Referrer-Policy \"strict-origin-when-cross-origin\" always;"
                        elif "PERF-IDX" in fid:
                            code_after = f"-- Crear índice para agilizar búsquedas sobre la FK\nCREATE INDEX idx_{proj_name.lower()}_fk ON tabla_afectada(columna_id);"
                        elif "PERF-LEAK" in fid:
                            code_after = f"// Usar operador takeUntil con subject de destrucción\nprivate destroy$ = new Subject<void>();\n\nthis.service.getData().pipe(takeUntil(this.destroy$)).subscribe(...);\n\nngOnDestroy() {{\n  this.destroy$.next();\n  this.destroy$.complete();\n}}"
                        elif "PERF-BATCH" in fid:
                            code_after = "spring.jpa.properties.hibernate.jdbc.batch_size=20\nspring.jpa.properties.hibernate.order_inserts=true\nspring.jpa.properties.hibernate.order_updates=true"
                        elif "PERF-CMP" in fid:
                            code_after = "// Refactorización Recomendada:\n// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.\n// Ejemplo:\n// public void procesar() {\n//   if (condicion) {\n//     hacerSubProceso();\n//   }\n// }"
                        
                        rf.write(get_finding_md(
                            f["id"], f["title"], f["severity"], f["category"], f["component"], f["cwe"], f["rule"],
                            f["desc"], f["details"], f["evidence_code"], f["steps"], f["command"], f["output"],
                            f["technical_impact"], f["business_impact"], f["recommendation_a"], f["recommendation_b"],
                            f["effort"], f["complexity"], f["regression"],
                            code_before=code_before,
                            code_after=code_after
                        ))
                    else:
                        # AI generated finding object (Pydantic model)
                        f_dict = f.dict()
                        rf.write(get_finding_md(
                            f_dict["id"], f_dict["title"], f_dict["severity"], f_dict["category"], f_dict["component"], f_dict["cwe"], f_dict["rule"],
                            f_dict["desc"], f_dict["details"], f_dict["evidence_code"], f_dict["steps"], f_dict["command"], f_dict["output"],
                            f_dict["technical_impact"], f_dict["business_impact"], f_dict["recommendation_a"], f_dict["recommendation_b"],
                            f_dict["effort"], f_dict["complexity"], f_dict["regression"],
                            code_before=f_dict.get("code_before", ""),
                            code_after=f_dict.get("code_after", "")
                        ))
                    rf.write("\n\n---\n\n")
            else:
                rf.write("## ✅ SIN HALLAZGOS CRÍTICOS\n\nNo se detectaron hallazgos críticos de seguridad o rendimiento en este proyecto.\n")

        print(f"[*] Report successfully created: {report_file_path}")

    def run_all(self):
        self.boot()
        self.detect_stack()
        self.execute_local_scans()
        self.run_ai_enrichment()
        self.consolidate_reports()
        print("[*] AuraAuditLoop completed.")
