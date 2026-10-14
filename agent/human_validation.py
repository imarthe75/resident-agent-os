"""Human-validation register: the AI accelerates, a person signs (ADR-0003 D5).

Anything an agent produces that must not ship unchecked (code, a spec, an analysis) is registered as PENDING with who/what produced it, and
stays PENDING until a *different, named* person approves or rejects it. Rules enforced here, not left to convention:
  * the validator must be a non-empty identity different from the producer (the AI cannot validate itself, nor can its operator under the same id);
  * a record is resolved once; a second resolution is an error (a rejection is not silently overturned);
  * the log is append-only JSONL with a hash chain (each line carries the sha256 of the previous one), so an edited or deleted line is detected
    by verify_chain().
State is derived by replaying the events. Storage is a local file (soberanía de datos); PostgreSQL is not required.
"""
import fcntl
import hashlib
import json
import os
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

PENDING, APPROVED, REJECTED = "PENDING", "APPROVED", "REJECTED"


class ValidationError(Exception):
    pass


def uuid7() -> str:
    """RFC 9562 UUIDv7 (time-ordered): the project's primary-key convention, without waiting for Python 3.14."""
    ms = int(time.time() * 1000)
    rand = secrets.randbits(74)
    v = (ms << 80) | (0x7 << 76) | ((rand >> 62) << 64) | (0b10 << 62) | (rand & ((1 << 62) - 1))
    h = f"{v:032x}"
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"


class HumanValidationRegistry:
    def __init__(self, path: Path | str = ".agent/human_validations.jsonl") -> None:
        self.path = Path(path)

    # ------------------------------------------------------------------ io
    def _events(self) -> List[dict]:
        if not self.path.exists():
            return []
        return [json.loads(l) for l in self.path.read_text(encoding="utf-8").splitlines() if l.strip()]

    def _append(self, event: dict) -> dict:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "a+", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                f.seek(0)
                lines = [l for l in f.read().splitlines() if l.strip()]
                prev = hashlib.sha256(lines[-1].encode("utf-8")).hexdigest() if lines else "0" * 64
                event = {**event, "prev_hash": prev, "at": datetime.now(timezone.utc).isoformat()}
                f.write(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n")
                f.flush()
                os.fsync(f.fileno())
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        return event

    # ------------------------------------------------------------------ api
    def request(self, subject: str, produced_by: str, ref: Optional[str] = None, kind: str = "ai_output") -> str:
        if not subject.strip() or not produced_by.strip():
            raise ValidationError("subject and produced_by are required")
        rid = uuid7()
        self._append({"event": "request", "id": rid, "subject": subject, "produced_by": produced_by.strip(), "kind": kind, "ref": ref})
        return rid

    def resolve(self, rid: str, validator: str, decision: str, note: str = "") -> dict:
        if decision not in (APPROVED, REJECTED):
            raise ValidationError("decision must be APPROVED or REJECTED")
        validator = (validator or "").strip()
        if not validator:
            raise ValidationError("a named validator is required")
        rec = self.get(rid)
        if rec is None:
            raise ValidationError(f"unknown validation id {rid}")
        if rec["status"] != PENDING:
            raise ValidationError(f"{rid} is already {rec['status']} (by {rec['validated_by']}); it cannot be resolved twice")
        if validator.lower() == rec["produced_by"].strip().lower():
            raise ValidationError("the validator cannot be the producer: the AI (or its operator under the same identity) does not sign its own work")
        if decision == REJECTED and not note.strip():
            raise ValidationError("a rejection needs a note saying why")
        self._append({"event": "resolve", "id": rid, "validated_by": validator, "decision": decision, "note": note})
        return self.get(rid)

    def get(self, rid: str) -> Optional[dict]:
        return self.all().get(rid)

    def all(self) -> Dict[str, dict]:
        recs: Dict[str, dict] = {}
        for e in self._events():
            if e["event"] == "request":
                recs[e["id"]] = {"id": e["id"], "subject": e["subject"], "produced_by": e["produced_by"], "kind": e["kind"], "ref": e.get("ref"),
                                 "requested_at": e["at"], "status": PENDING, "validated_by": None, "validated_at": None, "note": None}
            elif e["event"] == "resolve" and e["id"] in recs:
                recs[e["id"]].update(status=e["decision"], validated_by=e["validated_by"], validated_at=e["at"], note=e.get("note"))
        return recs

    def pending(self) -> List[dict]:
        return [r for r in self.all().values() if r["status"] == PENDING]

    def is_approved(self, subject: str) -> bool:
        """True if the LATEST record for this subject is APPROVED (a later pending/rejected request for the same subject revokes it)."""
        recs = [r for r in self.all().values() if r["subject"] == subject]
        return bool(recs) and sorted(recs, key=lambda r: r["requested_at"])[-1]["status"] == APPROVED

    def verify_chain(self) -> List[str]:
        """Problems found in the hash chain (empty list = intact)."""
        problems, prev = [], "0" * 64
        if not self.path.exists():
            return problems
        for i, line in enumerate([l for l in self.path.read_text(encoding="utf-8").splitlines() if l.strip()], 1):
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                problems.append(f"line {i}: not valid JSON")
                break
            if e.get("prev_hash") != prev:
                problems.append(f"line {i}: chain broken (a previous line was edited or removed)")
            prev = hashlib.sha256(line.encode("utf-8")).hexdigest()
        return problems
