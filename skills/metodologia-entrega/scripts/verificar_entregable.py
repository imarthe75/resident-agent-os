#!/usr/bin/env python3
"""Verifica un entregable llenado a partir de una plantilla de metodologia-entrega.

    python3 verificar_entregable.py <documento.md> [--plantilla <plantilla.md>]

Sin --plantilla, la busca por el título del documento (fila «Documento» de la tabla de control) en plantillas/.
Comprueba: pendientes «…» sin llenar, secciones «Llena: IA» sin «Revisó:», secciones obligatorias ausentes y patrones de secretos.
Sale con 1 si encuentra algún problema. Solo biblioteca estándar.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

PLANTILLAS = Path(__file__).resolve().parents[1] / "plantillas"
PENDIENTE = re.compile(r"«[^»]*»")
SECRETO = re.compile(r"(?i)(-----BEGIN [A-Z ]*PRIVATE KEY-----|(password|passwd|contraseña|secret|token|api[_-]?key)\s*[:=]\s*\S{6,}|glpat-[\w-]{10,}|AKIA[0-9A-Z]{16})")


def sin_codigo(texto: str) -> str:
    return re.sub(r"```.*?```", "", texto, flags=re.S)


def secciones(texto: str) -> list[tuple[str, str]]:
    partes = re.split(r"^(##\s+.+)$", texto, flags=re.M)
    return [(partes[i].lstrip("#").strip(), partes[i + 1]) for i in range(1, len(partes) - 1, 2)]


def titulo_documento(texto: str) -> str | None:
    m = re.search(r"^\|\s*Documento\s*\|\s*(.+?)\s*\|", texto, flags=re.M)
    return m.group(1) if m else None


def buscar_plantilla(titulo: str) -> Path | None:
    for p in sorted(PLANTILLAS.glob("[0-9]*.md")):
        if titulo_documento(p.read_text(encoding="utf-8")) == titulo:
            return p
    return None


def verificar(doc: Path, plantilla: Path | None) -> list[str]:
    texto = doc.read_text(encoding="utf-8")
    problemas: list[str] = []
    limpio = sin_codigo(texto)
    for n, linea in enumerate(limpio.splitlines(), 1):
        for m in PENDIENTE.finditer(linea):
            problemas.append(f"línea {n}: pendiente sin llenar {m.group(0)} (escribe el dato, o no aplica: <motivo>)")
        if SECRETO.search(linea):
            problemas.append(f"línea {n}: parece un secreto o credencial; el documento no puede contenerlos")
    for titulo, cuerpo in secciones(texto):
        if re.search(r"^>\s*Llena:\s*IA", cuerpo, flags=re.M) and not re.search(r"Revisó:\s*\S+", cuerpo):
            problemas.append(f"sección «{titulo}»: la redactó la IA y no tiene la línea Revisó: <nombre> · <fecha>")
    if plantilla is None:
        t = titulo_documento(texto)
        plantilla = buscar_plantilla(t) if t else None
        if plantilla is None:
            problemas.append("no se encontró la plantilla (fila «Documento» de la tabla de control); usa --plantilla")
    if plantilla is not None:
        req = [t for t, _ in secciones(plantilla.read_text(encoding="utf-8")) if not PENDIENTE.search(t)]
        tiene = {t for t, _ in secciones(texto)}
        for t in req:
            if t not in tiene:
                problemas.append(f"falta la sección obligatoria «{t}» de {plantilla.name}")
    return problemas


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("documento"); ap.add_argument("--plantilla")
    a = ap.parse_args()
    problemas = verificar(Path(a.documento), Path(a.plantilla) if a.plantilla else None)
    if problemas:
        print(f"✖ {a.documento}: {len(problemas)} problema(s)\n  - " + "\n  - ".join(problemas), file=sys.stderr)
        sys.exit(1)
    print(f"✓ {a.documento}: listo para revisión y firma")


if __name__ == "__main__":
    main()
