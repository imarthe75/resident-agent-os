import os
import re
from pydantic import BaseModel
from agent.skill_base import Skill

class SastScanInput(BaseModel):
    target_dir: str

class SastScanOutput(BaseModel):
    hardcoded_secrets: list[dict]
    cors_wildcards: list[dict]
    nginx_headers_missing: list[dict]

class SastScanSkill(Skill):
    name = "sast_scan"
    description = "Escanea el código local buscando secretos hardcodeados, orígenes CORS y headers de Nginx."
    input_schema = SastScanInput
    output_schema = SastScanOutput

    def execute(self, validated_input: SastScanInput) -> dict:
        target_dir = validated_input.target_dir
        secrets = []
        cors = []
        nginx = []

        for root, dirs, files in os.walk(target_dir):
            if "node_modules" in root or ".git" in root or "build" in root or "target" in root:
                continue

            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, target_dir)

                # Read content
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        lines = content.splitlines()
                except Exception:
                    continue

                # 1. Hardcoded Secrets in configurations
                if file.endswith((".properties", ".yml", ".yaml", ".json")):
                    for idx, line in enumerate(lines, 1):
                        if re.search(r'(password|secret-key|secret_key|jwt.*secret|jwt.*key)\s*[:=]\s*[^\s${}]+', line, re.IGNORECASE):
                            if not any(x in line for x in ["localhost", "127.0.0.1", "none", "null", "false", "true"]):
                                secrets.append({
                                    "file": rel_path,
                                    "line": idx,
                                    "content": line.strip()
                                })

                # 2. CORS Wildcards
                if file.endswith((".java", ".ts", ".js", ".properties", ".yml", ".yaml")):
                    for idx, line in enumerate(lines, 1):
                        if any(x in line for x in ["allowed.origins", "allowedOrigins", "CorsRegistry", "Access-Control-Allow-Origin", "allowed-origins"]):
                            if "*" in line:
                                cors.append({
                                    "file": rel_path,
                                    "line": idx,
                                    "content": line.strip()
                                })

                # 3. Nginx security headers
                if file == "nginx.conf":
                    missing = []
                    if "Content-Security-Policy" not in content:
                        missing.append("Content-Security-Policy")
                    if "Strict-Transport-Security" not in content:
                        missing.append("Strict-Transport-Security")
                    if "Referrer-Policy" not in content:
                        missing.append("Referrer-Policy")
                    
                    if missing:
                        nginx.append({
                            "file": rel_path,
                            "headers": ", ".join(missing)
                        })

        return {
            "hardcoded_secrets": secrets,
            "cors_wildcards": cors,
            "nginx_headers_missing": nginx
        }
