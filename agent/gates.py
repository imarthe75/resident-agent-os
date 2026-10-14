"""Stage gates as data (ADR-0003 D5): entry/exit criteria per stage in .agent/gates/etapa-N.yml, evaluated, and closed by someone OTHER
than the person who executed the stage.

Criterion types:
  file_exists      {path}                          a file or folder exists (relative to the project)
  command_exit0    {cmd, timeout?}                 a command (no shell) exits 0 -- tests, linters
  verifier         {name, require?}                a verifiers/ check answers CUMPLE (NO_EVALUADO does NOT satisfy it)
  human_validation {subject}                       the human-validation register holds an APPROVED record for that subject
Result per criterion: PASS | FAIL | NOT_EVALUATED (e.g. a verifier that could not decide). A gate is CLOSED only when every criterion PASSes AND a
verifier identity, different from the closer, is given; otherwise it is OPEN or PENDING_VERIFICATION. Nothing is ever "closed" by default.
"""
import shlex
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from agent.human_validation import HumanValidationRegistry

PASS, FAIL, NOT_EVALUATED = "PASS", "FAIL", "NOT_EVALUATED"
CLOSED, OPEN, PENDING_VERIFICATION = "CLOSED", "OPEN", "PENDING_VERIFICATION"


class GateError(Exception):
    pass


def load_gate(path: Path | str) -> dict:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    for key in ("stage", "name"):
        if key not in data:
            raise GateError(f"{path}: missing '{key}'")
    for phase in ("entry", "exit"):
        for c in data.get(phase, []) or []:
            if c.get("type") not in ("file_exists", "command_exit0", "verifier", "human_validation"):
                raise GateError(f"{path}: unknown criterion type {c.get('type')!r}")
    return data


def _eval(c: dict, project: Path, registry: HumanValidationRegistry) -> Dict[str, str]:
    t = c["type"]
    if t == "file_exists":
        ok = (project / c["path"]).exists()
        return {"status": PASS if ok else FAIL, "detail": c["path"]}
    if t == "command_exit0":
        try:
            r = subprocess.run(shlex.split(c["cmd"]), cwd=project, capture_output=True, text=True, timeout=c.get("timeout", 300))
        except (OSError, subprocess.TimeoutExpired) as e:
            return {"status": NOT_EVALUATED, "detail": f"{c['cmd']}: {type(e).__name__}: {e}"}
        return {"status": PASS if r.returncode == 0 else FAIL, "detail": f"{c['cmd']} -> exit {r.returncode}"}
    if t == "verifier":
        from verifiers.checks import CUMPLE, NO_EVALUADO, REGISTRY
        if c["name"] not in REGISTRY:
            raise GateError(f"unknown verifier {c['name']!r}")
        res = REGISTRY[c["name"]](project)
        if res.status == NO_EVALUADO:
            return {"status": NOT_EVALUATED, "detail": f"{c['name']}: NO_EVALUADO ({'; '.join(res.detail[:1])})"}
        return {"status": PASS if res.status == CUMPLE else FAIL, "detail": f"{c['name']}: {res.status}"}
    if t == "human_validation":
        ok = registry.is_approved(c["subject"])
        return {"status": PASS if ok else FAIL, "detail": f"validación humana de «{c['subject']}»" + ("" if ok else " pendiente o rechazada")}
    raise GateError(t)


def evaluate_gate(gate: dict, project: Path | str, closer: str, verifier: Optional[str] = None,
                  registry: Optional[HumanValidationRegistry] = None, phase: str = "exit") -> dict:
    project = Path(project)
    registry = registry or HumanValidationRegistry(project / ".agent" / "human_validations.jsonl")
    results: List[dict] = []
    for c in gate.get(phase, []) or []:
        results.append({"criterion": c.get("label") or c["type"], **_eval(c, project, registry)})
    all_pass = bool(results) and all(r["status"] == PASS for r in results)
    if not all_pass:
        status = OPEN
    elif not verifier or not verifier.strip() or verifier.strip().lower() == (closer or "").strip().lower():
        status = PENDING_VERIFICATION         # all criteria pass but nobody different from the closer has verified
    else:
        status = CLOSED
    return {"stage": gate["stage"], "name": gate["name"], "phase": phase, "closer": closer, "verifier": verifier, "status": status, "results": results,
            "note": "Una compuerta sin criterios nunca se cierra." if not results else ""}
