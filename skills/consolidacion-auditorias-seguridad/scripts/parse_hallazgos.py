#!/usr/bin/env python3
"""Convierte el `hallazgos.json` de la skill `auditoria-codigo` (auditoría manual o asistida) al archivo normalizado de hallazgos.

Uso:
  python parse_hallazgos.py <salida.json> <repositorio>=<hallazgos.json> [<repositorio>=<otro.json> ...]

Una fila por hallazgo. Solo entran los de estado `abierto`: un `falso_positivo` o `riesgo_aceptado` ya decidido por el auditor no se vuelve a
clasificar aquí (se informa cuántos hubo, para que el analista los registre en el catálogo si aplica). La severidad se traduce
(CRITICA->CRITICAL, ALTA->HIGH, MEDIA->MEDIUM, BAJA->LOW); `esfuerzo_horas`, cuando existe, se reparte entre las líneas del hallazgo.
"""
import json
import os
import sys
from collections import Counter, OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import normalize  # noqa: E402

SEV = {"CRITICA": "CRITICAL", "ALTA": "HIGH", "MEDIA": "MEDIUM", "BAJA": "LOW", "INFO": "INFO", "INFORMATIVA": "INFO"}


def parse(doc, repo):
    rows, skipped = [], Counter()
    for h in doc.get("hallazgos") or []:
        estado = h.get("estado") or "abierto"
        if estado != "abierto":
            skipped[estado] += 1
            continue
        sev = SEV.get(str(h.get("severidad", "")).upper())
        if not sev:
            raise SystemExit(f"{repo}: severidad desconocida en {h.get('id') or h.get('regla')}: {h.get('severidad')!r}")
        lines = h.get("lineas") or [None]
        horas = h.get("esfuerzo_horas")
        minutes = (float(horas) * 60 / len(lines)) if horas not in (None, "") else None
        que = h.get("titulo") or ""
        if h.get("id"):
            que = f"[{h['id']}] {que}"
        rows.append(normalize.item(asset=repo, rule=h["regla"], sev=sev, motor="auditoria-codigo",
                                   locations=[(h["archivo"], ln) for ln in lines], que=que,
                                   riesgo=f"Evidencia: {h.get('evidencia', 'sin dato')}. Categoría: {h.get('categoria', 'sin dato')}.",
                                   cwe=[c for c in (h.get("cwe") or []) if c], esfuerzo_min=minutes))
    return rows, skipped


def main(out, pairs):
    data = OrderedDict()
    for repo, path in normalize.parse_pairs(pairs):
        with open(path, encoding="utf-8") as fh:
            rows, skipped = parse(json.load(fh), repo)
        data.setdefault(repo, []).extend(rows)
        extra = ", ".join(f"{n} {e.replace('_', ' ')}" for e, n in sorted(skipped.items()))
        print(f"{repo}: {len(rows)} hallazgos abiertos" + (f" (fuera: {extra})" if extra else ""))
    normalize.write(out, data)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
