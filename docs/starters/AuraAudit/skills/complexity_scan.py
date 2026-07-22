import os
import re
from pydantic import BaseModel
from agent.skill_base import Skill

class ComplexityScanInput(BaseModel):
    target_dir: str

class ComplexityScanOutput(BaseModel):
    complex_files: list[dict]

class ComplexityScanSkill(Skill):
    name = "complexity_scan"
    description = "Analiza archivos Java y TypeScript midiendo la complejidad cognitiva / ciclomática local."
    input_schema = ComplexityScanInput
    output_schema = ComplexityScanOutput

    def execute(self, validated_input: ComplexityScanInput) -> dict:
        target_dir = validated_input.target_dir
        complex_files = []

        # Keywords that increase complexity
        complexity_keywords = re.compile(r'\b(if|for|while|catch|switch|case)\b|&&|\|\||\?')

        for root, dirs, files in os.walk(target_dir):
            if "node_modules" in root or ".git" in root or "build" in root or "target" in root:
                continue

            for file in files:
                if not file.endswith((".java", ".ts")):
                    continue

                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, target_dir)

                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        lines = content.splitlines()
                except Exception:
                    continue

                # Quick estimation of cognitive complexity per file
                score = 0
                evidence_lines = []
                for idx, line in enumerate(lines, 1):
                    matches = complexity_keywords.findall(line)
                    if matches:
                        score += len(matches)
                        if len(evidence_lines) < 3:  # grab first 3 complex lines
                            evidence_lines.append(f"Línea {idx}: {line.strip()}")

                # If the file complexity exceeds threshold of 15 (highly nested)
                if score > 15:
                    complex_files.append({
                        "file": rel_path,
                        "complexity_score": score,
                        "evidence": "\n".join(evidence_lines)
                    })

        return {
            "complex_files": complex_files
        }
