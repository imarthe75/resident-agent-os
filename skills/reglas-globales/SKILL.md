---
name: reglas-globales
description: Reglas que aplican a todo agente (Claude, Gemini/Antigravity, Codex, Copilot) en cualquier proyecto — credenciales y secretos, honestidad de resultados (nada de mocks presentados como reales), documentos escritos como versión original, y verificación antes de declarar algo terminado. Cárgala siempre, antes que cualquier otra skill.
---

# Reglas globales 

## 1. Credenciales y secretos (absoluta)
- **Nunca** se escriben credenciales (contraseñas, tokens/PAT, llaves privadas, `client-secret`, cadenas de conexión con contraseña, hashes
  SCRAM/MD5, llaves de cifrado o HMAC, secretos de API) en ningún archivo que pueda llegar a un repositorio, público o interno: código, SQL,
  `application*.properties`/`.yml`, `environment*.ts`, scripts, pruebas, documentación, logs, commits ni mensajes de commit.
- **Dónde sí:** gestor de secretos (Vault) o un archivo `.env` **fuera del repositorio**, con permisos `600` y en `.gitignore`. El código las lee
  del entorno: `${VARIABLE}` en Spring (sin valor por omisión), `\getenv` en psql ≥ 15 o `-v var="$VAR"`, `os.environ` en Python.
- Sin valores por omisión para secretos (`${DB_PASSWORD:admin123}` está prohibido): si falta la variable, la aplicación no arranca.
- **Nunca imprimir** credenciales en terminal, reportes, respuestas, capturas ni archivos de resultado.
- **Antes de cada commit:** revisar `git diff --cached`; si el repositorio tiene hook de pre-commit contra secretos, no se desactiva ni se usa `--no-verify`.
- **Si aparece una credencial expuesta:** moverla al gestor/`.env`, reemplazarla por la variable, sacarla del índice (`git rm --cached` si
  aplica) y avisar para **rotarla**: quitarla del archivo no la borra del historial de git.

## 2. Honestidad de resultados
- Prohibido declarar terminado algo con mocks, datos simulados, `TODO`, `pass`, funciones vacías o stubs. Si no se implementó la lógica real: PARCIAL.
- Una prueba que solo usó mocks o respuestas simuladas se declara así: «validado solo con mocks (0 % en producción)».
- Lo que no se pudo verificar se dice como estado actual («no verificado: requiere X»), nunca se presenta como aprobado.
- Un `catch` nunca traga el error: registra con traza completa o relanza. Nada falla en silencio devolviendo «éxito».
- Parches o diffs solo si se validaron contra el archivo real (`git apply --check`); nunca diffs inventados.

### 2.1 Durante el desarrollo: solo código real
Desde el primer commit se escribe la funcionalidad real, no una maqueta que «después se conecta»:
- **Prohibido en el código de la aplicación** (cualquier rama, no solo al entregar): datos simulados o respuestas escritas a mano en
  servicios, controladores o componentes; arreglos de ejemplo en lugar de la llamada al backend; pantallas maqueta con botones que no hacen
  nada; endpoints que devuelven valores fijos; `TODO`/`FIXME`, funciones vacías, `pass`, `throw new UnsupportedOperationException()`,
  `return null` provisional; código comentado «para después»; banderas que saltan validaciones o seguridad para «probar rápido».
- **Permitido, y solo así:**
  1. Mocks y dobles **dentro de pruebas** (`src/test`, `*.spec.ts`, `e2e/`), declarados como tales en el resultado.
  2. Un simulador explícito **solo de ambiente local** (p. ej. `mock.interceptor.ts` con `environment.useLocalMockAuth`), que no se registra
     en QA ni producción y que el build de producción no incluye.
  3. Datos semilla reales del catálogo cargados por migración, no escritos en el código.
- Si una dependencia todavía no existe (endpoint de otro equipo, servicio externo), se programa contra su contrato real (OpenAPI) y la
  tarea se declara **PARCIAL — bloqueada por X**; no se rellena con datos inventados para que «se vea terminado».
- Un componente que no se terminó se declara PARCIAL en el commit/MR y en la entrega, con lo que falta.

## 3. Documentos como versión original
Todo documento generado (diccionarios de datos, guías, manuales, especificaciones, informes, README) se redacta como **versión original**
(1.0 o la que se indique):
- Describe el estado vigente como especificación, no cómo se llegó a él: sin «antes», «ahora», «se corrigió», «nuevo», «ya no».
- Lo desconocido se declara «sin definición documentada».
- Las cifras llevan fecha y fuente.
- Excepciones: bitácoras e historiales por naturaleza (`STATE.md`, ADRs, changelogs, mensajes de commit).

## 4. Antes de decir «listo»
Ejecutar las pruebas y verificaciones, leer la salida real y el `git diff` (`verification-before-completion`). Si el proyecto tiene escáner de
seguridad, correrlo sobre los cambios; si no se pudo, decir «no verificado por escáner».

## 5. Pruebas sin tocar ambientes compartidos
Las pruebas que escriben o borran datos usan una base o servicio desechable con variables exclusivas de prueba; nunca heredan el destino de
producción ni de un ambiente compartido.
