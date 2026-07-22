import os
from pydantic import BaseModel
from agent.skill_base import Skill

class FrontendScanInput(BaseModel):
    target_dir: str

class FrontendScanOutput(BaseModel):
    orphan_subscriptions: list[dict]

class FrontendScanSkill(Skill):
    name = "frontend_scan"
    description = "Analiza componentes de Angular (.ts) buscando Observables no liberados en onDestroy."
    input_schema = FrontendScanInput
    output_schema = FrontendScanOutput

    def execute(self, validated_input: FrontendScanInput) -> dict:
        target_dir = validated_input.target_dir
        orphans = []

        for root, dirs, files in os.walk(target_dir):
            if "node_modules" in root or ".git" in root or "build" in root or "target" in root:
                continue

            for file in files:
                if not file.endswith(".ts"):
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
                    if ".subscribe(" in line and not any(x in line for x in ["takeUntil", "unsubscribe", "AsyncPipe"]):
                        if "unsubscribe()" not in content and "takeUntil" not in content:
                            orphans.append({
                                "file": rel_path,
                                "line": idx,
                                "content": line.strip()
                            })

        return {
            "orphan_subscriptions": orphans
        }
