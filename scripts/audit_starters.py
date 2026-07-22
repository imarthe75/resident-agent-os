#!/usr/bin/env python3
import os
import re
from pathlib import Path
from datetime import datetime

# Directorios de análisis
WORKSPACE_ROOT = Path("/opt/casmart")
PROYECTOS_DIR = WORKSPACE_ROOT / "docs" / "starters" / "proyectos"
REPORTES_DIR = WORKSPACE_ROOT / "docs" / "starters" / "reportes_auditoria"

# Exclusiones típicas de escaneo
EXCLUDE_DIRS = {".git", "node_modules", "target", "build", "dist", "venv", ".idea", ".vscode", "__pycache__"}

# Expresiones regulares para auditoría universal
PATTERNS = {
    # 1. Secretos hardcodeados
    "hardcoded_secrets": {
        "regex": re.compile(r'(?i)(password|passwd|secret|api_key|client_secret|private_key|token|auth_token)\s*[:=]\s*["\'][a-zA-Z0-9_\-\.\/]{10,}["\']'),
        "description": "Posible secreto o credencial hardcodeada en texto plano.",
        "category": "Seguridad (CWE-798 / OWASP A02:2021)"
    },
    # 2. CORS excesivamente permisivos
    "excessive_cors": {
        "regex": re.compile(r'(?i)(cors_origins|allow_origins|allowedorigins|cors\.allow)\s*=\s*["\']\*["\']'),
        "description": "CORS configurado con comodín '*'. Riesgo de fugas de datos.",
        "category": "Seguridad (CWE-942 / OWASP A05:2021)"
    },
    # 3. Manejo de errores silencioso
    "silent_catch": {
        "regex": re.compile(r'(catch\s*\(\s*\w*\s*\)\s*\{\s*\}|except\s*:\s*pass|except\s+Exception\s*:\s*pass)'),
        "description": "Catch o except vacío. Oculta errores silenciosamente sin loggear.",
        "category": "Estándares (Manejo de Errores Silencioso)"
    },
    # 4. Operaciones destructivas sin modal de confirmación en UI
    "destructive_op_no_confirm": {
        "regex": re.compile(r'\.(delete|remove|destroy|cancel|revoke|archive|deactivate|terminate)\('),
        "description": "Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación.",
        "category": "UX / Estándares (Confirmación de Operaciones)"
    }
}

def audit_file(file_path: Path, project_name: str) -> list:
    findings = []
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        lines = content.splitlines()
        
        # Saltarse archivos grandes para evitar falsos positivos de rendimiento
        if len(lines) > 5000:
            return findings

        # Buscar confirmaciones en el mismo archivo para operaciones destructivas
        has_confirmation_keywords = any(kw in content.lower() for kw in ["confirm", "modal", "dialog", "alerta", "alert", "sweetalert", "swal", "pop", "prompt"])

        for line_num, line_content in enumerate(lines, 1):
            line_content_stripped = line_content.strip()
            
            # Omitir líneas de comentarios
            if line_content_stripped.startswith(("//", "#", "/*", "*")):
                continue

            for pattern_name, meta in PATTERNS.items():
                match = meta["regex"].search(line_content)
                if match:
                    # Regla específica: si es destructiva pero tiene confirmación en el archivo, reducir severidad o descartar
                    if pattern_name == "destructive_op_no_confirm" and has_confirmation_keywords:
                        continue
                    
                    findings.append({
                        "file": str(file_path.relative_to(PROYECTOS_DIR / project_name)),
                        "line": line_num,
                        "code": line_content_stripped[:120],
                        "category": meta["category"],
                        "description": meta["description"],
                        "match": match.group(0)[:50]
                    })
    except Exception as e:
        # Errores de lectura ignorados
        pass
    return findings

def audit_project(project_path: Path) -> dict:
    project_name = project_path.name
    print(f"🔎 Auditando starter: {project_name}...")
    project_findings = []
    
    for root, dirs, files in os.walk(project_path):
        # Excluir carpetas no deseadas
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            # Analizar extensiones relevantes
            if file_path.suffix in ('.js', '.ts', '.html', '.java', '.py', '.cs', '.php', '.go', '.yml', '.yaml', '.properties'):
                file_findings = audit_file(file_path, project_name)
                project_findings.extend(file_findings)
                
    return {
        "name": project_name,
        "path": str(project_path),
        "findings": project_findings
    }

def generate_markdown_report(results: list, report_path: Path):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    total_findings = sum(len(r["findings"]) for r in results)
    
    md = []
    md.append(f"# 🛡️ Reporte Maestro de Auditoría Universal de Starters")
    md.append(f"**Fecha de Análisis:** {now}")
    md.append(f"**Total de Starters Auditados:** {len(results)}")
    md.append(f"**Total de Hallazgos Críticos:** {total_findings}\n")
    
    md.append("## 📊 Resumen por Proyecto")
    md.append("| Proyecto | Ruta | Hallazgos |")
    md.append("|---|---|---|")
    for r in results:
        findings_count = len(r["findings"])
        badge = "🟢 Limpio" if findings_count == 0 else f"🔴 {findings_count} hallazgos"
        md.append(f"| **{r['name']}** | `{r['path'].replace('/opt/casmart/', '')}` | {badge} |")
    md.append("\n---\n")
    
    md.append("## 🔍 Detalle de Hallazgos por Proyecto")
    
    for r in results:
        if not r["findings"]:
            continue
            
        md.append(f"### 📂 {r['name']}")
        md.append(f"Ruta: `{r['path']}`\n")
        
        # Agrupar hallazgos por categoría
        grouped = {}
        for f in r["findings"]:
            cat = f["category"]
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(f)
            
        for cat, items in grouped.items():
            md.append(f"#### ⚠️ {cat}")
            md.append("| Archivo | Línea | Código Coincidente | Descripción |")
            md.append("|---|---|---|---|")
            for item in items:
                # Sanitizar código para markdown
                code_sanitized = item['code'].replace('|', '\\|').replace('`', '\\`')
                md.append(f"| `{item['file']}` | {item['line']} | `{code_sanitized}` | {item['description']} |")
            md.append("")
        md.append("---\n")
        
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(md), encoding='utf-8')
    print(f"🎉 Reporte de auditoría generado correctamente en: {report_path}")

def main():
    if not PROYECTOS_DIR.exists():
        print(f"❌ Directorio de proyectos starters no existe: {PROYECTOS_DIR}")
        return
        
    results = []
    for item in PROYECTOS_DIR.iterdir():
        if item.is_dir() and item.name not in EXCLUDE_DIRS:
            project_results = audit_project(item)
            results.append(project_results)
            
    report_file = REPORTES_DIR / "audit_report_latest.md"
    generate_markdown_report(results, report_file)

if __name__ == "__main__":
    main()
