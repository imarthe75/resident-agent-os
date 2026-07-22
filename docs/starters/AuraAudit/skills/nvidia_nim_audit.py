import os
import requests
import json
from pydantic import BaseModel
from agent.skill_base import Skill

class AIFindingDetails(BaseModel):
    cause: str
    scenario: str
    consequence: str
    affects: str

class AITechnicalImpact(BaseModel):
    confidentiality: str
    conf_mag: str
    integrity: str
    int_mag: str
    availability: str
    disp_mag: str
    performance: str
    perf_mag: str

class AIBusinessImpact(BaseModel):
    compliance: str
    reputation: str
    users: str
    cost: str
    remediation_time: str

class AIRecommendation(BaseModel):
    name: str
    pro: str
    con: str
    effort: str
    pattern: str = ""

class AIFinding(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    component: str
    cwe: str
    rule: str
    desc: str
    details: AIFindingDetails
    evidence_code: str
    steps: str
    command: str
    output: str
    technical_impact: AITechnicalImpact
    business_impact: AIBusinessImpact
    recommendation_a: AIRecommendation
    recommendation_b: AIRecommendation
    effort: str
    complexity: str
    regression: str
    code_before: str = ""
    code_after: str = ""

class NvidiaNimAuditInput(BaseModel):
    file_name: str
    content: str

class NvidiaNimAuditOutput(BaseModel):
    has_issues: bool
    findings: list[AIFinding]

class NvidiaNimAuditSkill(Skill):
    name = "nvidia_nim_audit"
    description = "Utiliza Inteligencia Artificial vía la API de NVIDIA NIM para auditar la semántica del código."
    input_schema = NvidiaNimAuditInput
    output_schema = NvidiaNimAuditOutput

    def execute(self, validated_input: NvidiaNimAuditInput) -> dict:
        api_key = os.environ.get("NVIDIA_NIM_API_KEY")
        if not api_key:
            return {"has_issues": False, "findings": []}

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # Clear structured prompt requesting exact JSON schema
        prompt = f"""
        Actúa como un Auditor Senior de Seguridad y Rendimiento de Sistemas. Analiza el siguiente archivo:
        Nombre de Archivo: {validated_input.file_name}

        Código:
        \"\"\"
        {validated_input.content}
        \"\"\"

        Identifica problemas críticos de OWASP (BOLA, IDOR, SQLi, Secrets, CORS) o cuellos de botella de rendimiento.
        Si no hay vulnerabilidades o son de severidad baja/nula, pon "has_issues": false y "findings": [].
        Si encuentras problemas reales, llena el listado.
        
        Debes retornar un objeto JSON con este formato exacto:
        {{
          "has_issues": true,
          "findings": [
            {{
              "id": "SEC-XYZ",
              "title": "Breve título descriptivo",
              "severity": "🔴 Crítica / 🟠 Alta / 🟡 Media / 🟢 Baja",
              "category": "Seguridad / Rendimiento / Lógica / Mantenibilidad",
              "component": "{validated_input.file_name}",
              "cwe": "CWE-XXXX",
              "rule": "OWASP A0X / Standard",
              "desc": "Qué está mal de forma objetiva",
              "details": {{
                "cause": "Causa raíz del problema",
                "scenario": "Escenario de explotación o fallo",
                "consequence": "Consecuencia si no se arregla",
                "affects": "Usuarios o componentes afectados"
              }},
              "evidence_code": "Snippet de código problemático",
              "steps": "Pasos manuales para reproducir",
              "command": "Comando terminal para verificar",
              "output": "Resultado esperado del comando",
              "technical_impact": {{
                "confidentiality": "Descripción", "conf_mag": "🔴 Crítica / 🟠 Alta / 🟡 Media / 🟢 Baja / ✅ No aplica",
                "integrity": "Descripción", "int_mag": "🔴 Crítica / 🟠 Alta / 🟡 Media / 🟢 Baja / ✅ No aplica",
                "availability": "Descripción", "disp_mag": "🔴 Crítica / 🟠 Alta / 🟡 Media / 🟢 Baja / ✅ No aplica",
                "performance": "Descripción", "perf_mag": "🔴 Crítica / 🟠 Alta / 🟡 Media / 🟢 Baja / ✅ No aplica"
              }},
              "business_impact": {{
                "compliance": "Consecuencia normativa",
                "reputation": "Impacto reputacional",
                "users": "Número o perfil de usuarios impactados",
                "cost": "Costos de multas o infraestructura",
                "remediation_time": "Tiempo estimado de remediación"
              }},
              "recommendation_a": {{
                "name": "Opción A", "pro": "Ventaja", "con": "Desventaja", "effort": "Bajo/Medio/Alto"
              }},
              "recommendation_b": {{
                "name": "Opción B", "pro": "Ventaja", "con": "Desventaja", "effort": "Bajo/Medio/Alto", "pattern": "Patrón sugerido"
              }},
              "effort": "Bajo (<4h) / Medio (4-16h) / Alto (>16h)",
              "complexity": "Baja / Media / Alta",
              "regression": "Bajo / Medio / Alto",
              "code_before": "Fragmento exacto de código con la vulnerabilidad",
              "code_after": "Código corregido y seguro correspondiente"
            }}
          ]
        }}
        """

        payload = {
            "model": "meta/llama-3.1-70b-instruct",
            "messages": [
                {"role": "system", "content": "Eres un parseador de JSON estricto. Siempre retornas únicamente JSON válido, sin explicaciones ni markdown en tu salida."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 2048
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=5)
            if response.status_code == 429:
                print("    [!] NVIDIA NIM API returned 429: Too Many Requests (Rate limit / Quota exceeded).")
                return {"has_issues": False, "findings": []}
            elif response.status_code != 200:
                print(f"    [e] NVIDIA NIM API returned error status {response.status_code}: {response.text}")
                return {"has_issues": False, "findings": []}

            res_json = response.json()
            message_content = res_json["choices"][0]["message"]["content"].strip()
            
            # Clean markdown formatting if present
            if message_content.startswith("```json"):
                message_content = message_content[7:-3].strip()
            elif message_content.startswith("```"):
                message_content = message_content[3:-3].strip()

            parsed = json.loads(message_content)
            return parsed
        except Exception as e:
            # Fallback degradado ante fallos de red o de parseo de JSON
            print(f"    [e] Error llamando a NVIDIA NIM API: {e}")
            return {"has_issues": False, "findings": []}
