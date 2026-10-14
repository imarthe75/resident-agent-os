"""Project profile: the few facts that decide WHICH rules and checks apply to this project (ADR-0003 D7).

.agent/PROFILE.json  (declared by a person, never inferred):
  {"lifecycle": "predictive|iterative|support", "modules": ["integrations", "migrations", ...],
   "has_ui": true, "starts_from_base": true}
A rule file may start with a front-matter line  `applies_when: has_ui`  (or `lifecycle=iterative`, `module=migrations`, comma-separated = ALL must hold).
Files without it always apply. A profile that is missing means "unknown": every rule applies (never silently skip a rule for lack of a profile).
"""
import json
import re
from pathlib import Path
from typing import Dict, List

LIFECYCLES = ("predictive", "iterative", "support")


class ProfileError(Exception):
    pass


def load_profile(path: Path | str) -> Dict:
    p = Path(path)
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ProfileError(f"{p}: invalid JSON: {e}") from e
    if data.get("lifecycle") is not None and data["lifecycle"] not in LIFECYCLES:
        raise ProfileError(f"{p}: lifecycle must be one of {LIFECYCLES}")
    for k in ("has_ui", "starts_from_base"):
        if k in data and not isinstance(data[k], bool):
            raise ProfileError(f"{p}: {k} must be true/false")
    if "modules" in data and not (isinstance(data["modules"], list) and all(isinstance(m, str) for m in data["modules"])):
        raise ProfileError(f"{p}: modules must be a list of strings")
    return data


def _holds(cond: str, profile: Dict) -> bool:
    cond = cond.strip()
    if "=" in cond:
        key, val = (x.strip() for x in cond.split("=", 1))
        if key == "module":
            return val in profile.get("modules", [])
        return str(profile.get(key)) == val
    return profile.get(cond) is True


def applies(applies_when: str, profile: Dict) -> bool:
    """No profile (empty) -> True. No condition -> True."""
    if not profile or not applies_when:
        return True
    return all(_holds(c, profile) for c in applies_when.split(",") if c.strip())


_FM = re.compile(r"\A\s*(?:---\s*\n)?applies_when:\s*(?P<v>[^\n]+)", re.IGNORECASE)


def applicable_rule_files(rules_dir: Path | str, profile: Dict) -> List[Path]:
    out = []
    for f in sorted(Path(rules_dir).rglob("*.md")):
        m = _FM.match(f.read_text(encoding="utf-8", errors="replace")[:400])
        if applies(m.group("v") if m else "", profile):
            out.append(f)
    return out
