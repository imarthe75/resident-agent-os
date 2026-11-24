#!/usr/bin/env python3
"""Auditoría de código sin escáner: valida el archivo de hallazgos, genera resumen y matriz con plazos, y compara dos corridas.

    python3 auditoria.py validar  hallazgos.json
    python3 auditoria.py resumen  hallazgos.json --out salida/        -> resumen.md + matriz.csv
    python3 auditoria.py comparar anterior.json actual.json --out salida/  -> comparativo.md

Solo biblioteca estándar. Sale con 1 si el archivo es inválido.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import sys
from pathlib import Path

SEVERIDADES = ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFO"]
P_NIVEL = {"CRITICA": "P0", "ALTA": "P1", "MEDIA": "P2", "BAJA": "P3", "INFO": "P4"}
SLA_DIAS = {"CRITICA": 1, "ALTA": 7, "MEDIA": 30, "BAJA": 90, "INFO": None}
CATEGORIAS = ["VULNERABILIDAD", "CUMPLIMIENTO", "INFORMATIVO"]
EVIDENCIA = ["Cierto", "Probable", "Hipotesis"]
ESTADOS = ["abierto", "corregido", "falso_positivo", "riesgo_aceptado"]
REQUERIDOS = ["regla", "titulo", "severidad", "categoria", "archivo", "evidencia", "estado", "detectado"]


def _fecha(v: str) -> dt.date:
    return dt.date.fromisoformat(v)


def validar(hallazgos: list[dict]) -> list[str]:
    errores: list[str] = []
    claves: set[tuple] = set()
    for i, h in enumerate(hallazgos):
        donde = f"hallazgo[{i}] {h.get('regla', '?')} {h.get('archivo', '?')}"
        for k in REQUERIDOS:
            if not h.get(k):
                errores.append(f"{donde}: falta «{k}»")
        if h.get("severidad") and h["severidad"] not in SEVERIDADES:
            errores.append(f"{donde}: severidad «{h['severidad']}» no es una de {SEVERIDADES}")
        if h.get("categoria") and h["categoria"] not in CATEGORIAS:
            errores.append(f"{donde}: categoria «{h['categoria']}» no es una de {CATEGORIAS}")
        if h.get("evidencia") and h["evidencia"] not in EVIDENCIA:
            errores.append(f"{donde}: evidencia «{h['evidencia']}» no es una de {EVIDENCIA}")
        if h.get("estado") and h["estado"] not in ESTADOS:
            errores.append(f"{donde}: estado «{h['estado']}» no es uno de {ESTADOS}")
        for campo in ("detectado", "vence_aceptacion"):
            if h.get(campo):
                try:
                    _fecha(h[campo])
                except ValueError:
                    errores.append(f"{donde}: {campo} no es una fecha AAAA-MM-DD")
        lineas = h.get("lineas", [])
        if not isinstance(lineas, list) or not all(isinstance(x, int) and x > 0 for x in lineas):
            errores.append(f"{donde}: «lineas» debe ser una lista de enteros positivos")
        if h.get("estado") == "falso_positivo" and not h.get("justificacion"):
            errores.append(f"{donde}: un falso positivo necesita «justificacion» (por qué no aplica en ESTE archivo)")
        if h.get("estado") == "riesgo_aceptado":
            if not h.get("justificacion") or not h.get("vence_aceptacion"):
                errores.append(f"{donde}: un riesgo aceptado necesita «justificacion» y «vence_aceptacion»")
            elif h.get("detectado") and h.get("vence_aceptacion"):
                try:
                    if (_fecha(h["vence_aceptacion"]) - _fecha(h["detectado"])).days > 365:
                        errores.append(f"{donde}: un riesgo aceptado vence a más tardar 365 días después de detectarse")
                except ValueError:
                    pass
        if h.get("evidencia") == "Hipotesis" and h.get("severidad") in ("CRITICA", "ALTA") and h.get("estado") == "abierto":
            errores.append(f"{donde}: una hipótesis no se reporta como CRITICA/ALTA; verifícala (Probable/Cierto) o baja su severidad")
        clave = (h.get("regla"), h.get("archivo"))
        if clave in claves:
            errores.append(f"{donde}: duplicado; un hallazgo por regla y archivo (junta las líneas en «lineas»)")
        claves.add(clave)
    return errores


def cargar(path: str, con_alcance: bool = False):
    datos = json.loads(Path(path).read_text(encoding="utf-8"))
    hallazgos = datos["hallazgos"] if isinstance(datos, dict) else datos
    alcance = (datos.get("alcance") or {}) if isinstance(datos, dict) else {}
    errores = validar(hallazgos)
    for c in alcance.get("categorias", []):
        if c not in CATEGORIAS:
            errores.append(f"alcance.categorias: «{c}» no es una de {CATEGORIAS}")
    if errores:
        print("✖ " + path + " inválido:\n  - " + "\n  - ".join(errores), file=sys.stderr)
        sys.exit(1)
    return (hallazgos, alcance) if con_alcance else hallazgos


def vence(h: dict) -> str:
    dias = SLA_DIAS[h["severidad"]]
    return "" if dias is None else (_fecha(h["detectado"]) + dt.timedelta(days=dias)).isoformat()


def resumen(hallazgos: list[dict], out: Path, hoy: dt.date) -> None:
    out.mkdir(parents=True, exist_ok=True)
    abiertos = [h for h in hallazgos if h["estado"] == "abierto"]
    lineas = ["# Resumen de auditoría", "", f"Fecha de corte: {hoy.isoformat()}. Cuenta solo hallazgos abiertos; los demás estados van aparte.", ""]
    for cat in CATEGORIAS:
        sub = [h for h in abiertos if h["categoria"] == cat]
        lineas += [f"## {cat.capitalize()} ({len(sub)})", "", "| Severidad | Abiertos | Vencidos | Cierto | Probable | Hipótesis |", "|---|---|---|---|---|---|"]
        for s in SEVERIDADES:
            g = [h for h in sub if h["severidad"] == s]
            venc = sum(1 for h in g if vence(h) and _fecha(vence(h)) < hoy)
            ev = {e: sum(1 for h in g if h["evidencia"] == e) for e in EVIDENCIA}
            lineas.append(f"| {s} ({P_NIVEL[s]}) | {len(g)} | {venc} | {ev['Cierto']} | {ev['Probable']} | {ev['Hipotesis']} |")
        lineas.append("")
    otros = {e: sum(1 for h in hallazgos if h["estado"] == e) for e in ESTADOS if e != "abierto"}
    lineas += ["## Fuera del conteo", "", *[f"- {k.replace('_', ' ')}: {v}" for k, v in otros.items()], ""]
    horas = [h.get("esfuerzo_horas") for h in abiertos]
    if any(x is not None for x in horas):
        con = sum(x for x in horas if x is not None)
        sin = sum(1 for x in horas if x is None)
        lineas += [f"Esfuerzo estimado de lo abierto: {con:g} h" + (f" ({sin} hallazgos sin estimar)" if sin else "") + ".", ""]
    (out / "resumen.md").write_text("\n".join(lineas), encoding="utf-8")
    with (out / "matriz.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "regla", "titulo", "categoria", "severidad", "prioridad", "archivo", "lineas", "evidencia", "estado",
                    "detectado", "vence_sla", "vencido", "esfuerzo_horas", "responsable", "justificacion", "vence_aceptacion"])
        orden = sorted(hallazgos, key=lambda h: (ESTADOS.index(h["estado"]), SEVERIDADES.index(h["severidad"]), h["archivo"]))
        for i, h in enumerate(orden, 1):
            v = vence(h) if h["estado"] == "abierto" else ""
            w.writerow([h.get("id") or f"H-{i:03d}", h["regla"], h["titulo"], h["categoria"], h["severidad"], P_NIVEL[h["severidad"]],
                        h["archivo"], ",".join(map(str, h.get("lineas", []))), h["evidencia"], h["estado"], h["detectado"], v,
                        "si" if v and _fecha(v) < hoy else "", h.get("esfuerzo_horas", ""), h.get("responsable", ""),
                        h.get("justificacion", ""), h.get("vence_aceptacion", "")])


def _revisado(h: dict, alcance: dict) -> bool:
    """La corrida actual revisó la regla de h si su alcance la incluye (sin alcance declarado se asume completo)."""
    cats, reglas, archivos = alcance.get("categorias"), alcance.get("reglas"), alcance.get("archivos")
    if cats is not None and h["categoria"] not in cats:
        return False
    if reglas is not None and h["regla"] not in reglas:
        return False
    if archivos is not None and not any(h["archivo"].startswith(a) for a in archivos):
        return False
    return True


def comparar(ant: list[dict], act: list[dict], out: Path, alcance: dict | None = None) -> None:
    alcance = alcance or {}
    out.mkdir(parents=True, exist_ok=True)
    idx_act = {(h["regla"], h["archivo"]): h for h in act}
    filas, vistos = [], set()
    for h in ant:
        k = (h["regla"], h["archivo"]); n = idx_act.get(k); vistos.add(k)
        if h["estado"] != "abierto":
            if n and n["estado"] == "abierto" and h["estado"] == "corregido":
                filas.append(("Reaparecido", n))
            continue
        if n is None and not _revisado(h, alcance):
            filas.append(("No re-verificado", h))
        elif n is None or n["estado"] == "corregido":
            filas.append(("Solventado", h))
        elif n["estado"] in ("falso_positivo", "riesgo_aceptado"):
            filas.append(("Reclasificado (" + n["estado"].replace("_", " ") + ")", n))
        elif set(n.get("lineas", [])) != set(h.get("lineas", [])):
            filas.append(("Persiste (cambió de línea)", n))
        else:
            filas.append(("Persiste", n))
    for k, n in idx_act.items():
        if k not in vistos and n["estado"] == "abierto":
            filas.append(("Nuevo", n))
    orden = ["Nuevo", "Reaparecido", "Persiste", "Persiste (cambió de línea)", "No re-verificado", "Solventado"]
    cuenta = {}
    for e, _ in filas:
        cuenta[e] = cuenta.get(e, 0) + 1
    l = ["# Comparativo entre corridas", "", "Se empareja por regla y archivo; un hallazgo que solo cambió de línea persiste. «No re-verificado»: la corrida actual no revisó",
         "esa regla o ese archivo (fuera de su `alcance`), así que su ausencia no prueba que se corrigió.", "",
         "| Resultado | Hallazgos |", "|---|---|", *[f"| {e} | {cuenta[e]} |" for e in sorted(cuenta, key=lambda x: orden.index(x) if x in orden else 99)], "",
         "| Resultado | Severidad | Regla | Archivo | Líneas |", "|---|---|---|---|---|"]
    for e, h in sorted(filas, key=lambda f: (orden.index(f[0]) if f[0] in orden else 99, SEVERIDADES.index(f[1]["severidad"]))):
        l.append(f"| {e} | {h['severidad']} | `{h['regla']}` | `{h['archivo']}` | {','.join(map(str, h.get('lineas', [])))} |")
    (out / "comparativo.md").write_text("\n".join(l) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("validar"); v.add_argument("hallazgos")
    r = sub.add_parser("resumen"); r.add_argument("hallazgos"); r.add_argument("--out", default="salida"); r.add_argument("--hoy")
    c = sub.add_parser("comparar"); c.add_argument("anterior"); c.add_argument("actual"); c.add_argument("--out", default="salida")
    a = ap.parse_args()
    if a.cmd == "validar":
        n = len(cargar(a.hallazgos)); print(f"✓ {n} hallazgos válidos")
    elif a.cmd == "resumen":
        hoy = _fecha(a.hoy) if a.hoy else dt.date.today()
        resumen(cargar(a.hallazgos), Path(a.out), hoy); print(f"✓ {a.out}/resumen.md y {a.out}/matriz.csv")
    else:
        actual, alcance = cargar(a.actual, con_alcance=True)
        comparar(cargar(a.anterior), actual, Path(a.out), alcance); print(f"✓ {a.out}/comparativo.md")


if __name__ == "__main__":
    main()
