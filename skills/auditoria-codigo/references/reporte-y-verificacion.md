# Reporte de auditoría y verificación por ecosistema

## Comandos que convierten un hallazgo en «Cierto»
Se ejecutan en el proyecto auditado (en contenedor si el proyecto lo exige) y su salida real va en la tarjeta del hallazgo.

| Ecosistema | Tipos y compilación | Pruebas | Dependencias (si hay red y está permitido) |
|---|---|---|---|
| TypeScript / Angular | `npx tsc --noEmit` · `npx ng build --configuration production` | `npx ng test --watch=false` | `npm audit --omit=dev` |
| React / Vue (Vite) | `npx tsc --noEmit` · `npx vite build` | `npx vitest run` | `npm audit --omit=dev` |
| Java (Gradle) | `./gradlew compileJava` | `./gradlew test` (y `check` si incluye cobertura) | `./gradlew dependencies` + la versión vigente de cada librería |
| Java (Maven) | `mvn -q compile` | `mvn test` | `mvn dependency:tree` |
| Python | `mypy .` | `pytest -q --tb=short` | `pip-audit` |
| API en ejecución | — | `curl -i` con un usuario de otro rol u otra unidad (403/404 esperado), sin datos reales | — |

Nunca: pruebas de carga o de fuerza bruta contra ambientes compartidos, comandos que borren datos o contenedores ajenos
(`docker system prune -a --volumes`), ni credenciales reales en un comando o un reporte.

## Tarjeta de un hallazgo
```markdown
### [ID] Título corto
- **Regla:** `<id del catálogo>` · **Categoría:** Vulnerabilidad | Cumplimiento | Informativo · **Severidad:** Crítica | Alta | Media | Baja (P0–P3)
- **Ubicación:** `archivo:línea` (todas las líneas del mismo archivo en un solo hallazgo)
- **Evidencia:** Cierto (comando ejecutado) | Probable (patrón confirmado en el código) | Hipótesis (por verificar)
- **Qué pasa:** <descripción objetiva>
- **Evidencia:** fragmento de código y, si es Cierto, el comando y su salida real
- **Impacto:** técnico y de negocio, en una frase cada uno
- **Corrección:** código actual → código propuesto (la corrección del catálogo de la regla)
```

## Estructura del reporte
1. **Resumen ejecutivo** — sistema, rama y commit auditados, fecha de corte, alcance (qué categorías, reglas y carpetas se revisaron)
   y la tabla de `resumen.md`. Sin «score global», «nivel CMMI» ni porcentajes de cumplimiento que no salgan de una medición: lo no
   evaluado se dice «no evaluado».
2. **Hallazgos** — tarjetas, de mayor a menor severidad; primero Vulnerabilidad, luego Cumplimiento, luego Informativo.
3. **Matriz de seguimiento** — `matriz.csv` (plazo por severidad, responsable, esfuerzo).
4. **Falsos positivos y riesgos aceptados** — cada uno con su justificación y, el riesgo aceptado, con fecha de vencimiento.
5. **Comparativo** — si hubo una corrida anterior, `comparativo.md`.
6. **Límites** — lo que no se pudo verificar y por qué, en una línea cada uno.
