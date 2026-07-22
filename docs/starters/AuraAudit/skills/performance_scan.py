import os
import re
from pydantic import BaseModel
from agent.skill_base import Skill

class PerformanceScanInput(BaseModel):
    target_dir: str

class PerformanceScanOutput(BaseModel):
    missing_indexes: list[dict]

class PerformanceScanSkill(Skill):
    name = "performance_scan"
    description = "Analiza bases de datos y scripts de migración buscando llaves foráneas sin índices asociados."
    input_schema = PerformanceScanInput
    output_schema = PerformanceScanOutput

    def execute(self, validated_input: PerformanceScanInput) -> dict:
        target_dir = validated_input.target_dir
        missing = []

        for root, dirs, files in os.walk(target_dir):
            if "node_modules" in root or ".git" in root or "build" in root or "target" in root:
                continue

            for file in files:
                if not file.endswith(".sql"):
                    continue

                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, target_dir)

                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        lines = content.splitlines()
                except Exception:
                    continue

                for idx, line in enumerate(lines, 1):
                    if re.search(r'FOREIGN KEY|REFERENCES', line, re.IGNORECASE) or re.search(r'email|username|usuario_id|sede_id', line, re.IGNORECASE):
                        if "CREATE INDEX" not in content and "create index" not in content:
                            missing.append({
                                "file": rel_path,
                                "line": idx,
                                "content": line.strip()
                            })

        return {
            "missing_indexes": missing
        }
