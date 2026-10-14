"""Parser for .agent/SPECS.md: the spec contract gate ("no code without an approved spec").

A spec is a heading line containing its id in brackets, followed by a bullet `**Estado:**` with its own status:

    ### [EJEMPLO-001] Integración de Memoria Dual
    - **Estado:** `APROBADO`

The id must match EXACTLY (a substring match let `SPEC-1` be "found" inside `SPEC-12`), and the status that counts is the one of THAT spec
(the old check accepted any "APROBADO" anywhere in the file).
"""
import re
from typing import Dict

APPROVED = "APROBADO"
_HEADING = re.compile(r"^#{2,4}\s*\[(?P<id>[A-Za-z0-9_.\-]+)\]\s*(?P<title>.*)$", re.MULTILINE)
_STATUS = re.compile(r"\*\*Estado:?\*\*:?\s*`?(?P<status>[A-ZÁÉÍÓÚÑ_ ]+?)`?\s*(?:$|\n|\|)", re.MULTILINE)


def parse_specs(text: str) -> Dict[str, dict]:
    """{spec_id: {"title", "status" (upper-case or None), "body"}}"""
    heads = list(_HEADING.finditer(text or ""))
    out: Dict[str, dict] = {}
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        body = text[m.end():end]
        st = _STATUS.search(body)
        out[m.group("id")] = {"title": m.group("title").strip(), "status": st.group("status").strip().upper() if st else None, "body": body.strip()}
    return out
