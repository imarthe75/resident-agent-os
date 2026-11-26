# Formato normalizado de hallazgos

Es la entrada de `triage_report.py` y `comparar_corridas.py`. Lo escriben `parse_sarif.py` (cualquier herramienta que exporte SARIF 2.1.0) y
`parse_hallazgos.py` (el `hallazgos.json` de la skill `auditoria-codigo`). Una herramienta sin SARIF se integra con un lector propio que
escriba este mismo formato: el resto del flujo no cambia.

```json
{
  "<repositorio>": [
    {
      "asset": "backend-pagos",
      "rule": "python.lang.security.audit.eval-detected.eval-detected",
      "motor": "semgrep",
      "sev": "MEDIUM",
      "sev_herramienta": "MEDIUM",
      "norisk": false,
      "n": 3,
      "ubicaciones": [{"file": "src/svc.py", "lines": [3, 41]}, {"file": "src/otro.py", "lines": [9]}],
      "n_ubic_declaradas": 3,
      "n_archivos_declarados": 2,
      "truncado": false,
      "cwe": ["CWE-95"],
      "que": "Detected the use of eval()...",
      "riesgo": "Descripción larga de la regla",
      "esfuerzo_min": null,
      "noact": false,
      "patch": "",
      "sca": null
    }
  ]
}
```

| Campo | Significado |
| --- | --- |
| clave de primer nivel | Repositorio tal como saldrá en el libro. Con varios archivos, las listas del mismo repositorio se unen. |
| `rule`, `motor` | Id de la regla en la herramienta y nombre de la herramienta (en minúsculas, una palabra). El catálogo clasifica por estos dos. |
| `sev` | Severidad efectiva: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` o `INFO`. |
| `sev_herramienta` | La que reportó la herramienta antes de cualquier ajuste; igual a `sev` si no hubo ajuste. |
| `norisk` | `true` si la propia fuente concluyó que no hay riesgo real; el libro la cuenta como Informativa. |
| `n` | Ocurrencias que la fuente declara para esa regla. |
| `ubicaciones` | Todas las ubicaciones conocidas, agrupadas por archivo. |
| `truncado` | `true` si la fuente lista menos ubicaciones que `n`. Las que faltan se clasifican solo con reglas genéricas y `comparar_corridas.py` no concluye sobre ellas. |
| `cwe` | Lista `CWE-<n>`; vacía si la fuente no la da. |
| `esfuerzo_min` | Minutos por ocurrencia que estima la herramienta; `null` si no estima (el plan usa entonces los supuestos del analista). |
| `sca` | `[paquete, versión instalada, versión corregida, alcanzabilidad]` para dependencias; `null` en lo demás. Con `sca`, el hallazgo entra a «Versiones desactualizadas». |
| `noact`, `patch` | Reservados (sin uso en la clasificación). |

## Qué hace cada lector

**`parse_sarif.py`**: una fila por regla × repositorio × paquete (un CVE en dos paquetes son dos filas, porque cada una se corrige con su propia
actualización). Severidad: `security-severity` (CVSS; ≥9 CRITICAL, ≥7 HIGH, ≥4 MEDIUM, >0 LOW) de la regla o del resultado; si no existe, el nivel
SARIF (`error` HIGH, `warning` MEDIUM, `note` LOW). CWE desde las etiquetas o relaciones de la regla. Paquete y versiones desde el mensaje con el
formato de Trivy (`Package:` / `Installed Version:` / `Fixed Version:`). La alcanzabilidad queda vacía: SARIF no la trae y no se supone. Los
resultados con `suppressions` en el propio SARIF no se cuentan; se informa cuántos hubo.

**`parse_hallazgos.py`**: una fila por hallazgo de estado `abierto`. Los `falso_positivo` y `riesgo_aceptado` ya decididos por el auditor no se
reclasifican; se informa cuántos hubo para que el analista los registre en el catálogo. `CRITICA/ALTA/MEDIA/BAJA` se traducen a la escala de
arriba; `esfuerzo_horas` se reparte entre las líneas del hallazgo.

## Comprobaciones antes de clasificar
- Cada lector imprime reglas y ocurrencias por archivo: compáralas con el resumen de la propia herramienta. Una diferencia significa que se
  perdió o se duplicó algo.
- Una regla con `truncado: true` no permite dar nada por resuelto entre corridas.
- Un repositorio sin archivo de entrada no aparece en el libro: la hoja Cobertura solo lista lo recibido. «Sin reporte» no es «limpio».
