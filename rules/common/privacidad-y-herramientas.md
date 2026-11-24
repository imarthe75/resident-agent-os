# Privacidad y herramientas externas

El código, los datos, los documentos y las decisiones del proyecto no salen de la organización salvo por los canales que ella aprobó.

## Obligatorio
1. **Solo los asistentes de IA aprobados.** El agente con el que se trabaja (Claude Code, Codex, Gemini CLI u otro) es el que la
   organización autorizó, con la política de datos del proyecto. Si el contrato prohíbe cargar el código del cliente a herramientas de
   IA, el agente se detiene y lo informa.
2. **Nada de terceros sin autorización escrita**: ninguna skill, agente, plugin, extensión, servidor MCP o script de un repositorio
   público (`npx skills add …`, `curl … | sh`, `git clone` de un tercero para ejecutarlo). Lo que haga falta se **adapta y se crea dentro
   del repositorio del kit o del proyecto**, se revisa en Merge Request y queda versionado.
3. **Dependencias del proyecto solo por Merge Request**: con versión fija (`rules/common/versions.md`), lockfile y escaneo de seguridad.
   El agente no agrega ni actualiza una dependencia por su cuenta «para probar», ni siquiera de forma temporal.
4. **No enviar información del proyecto a servicios de la web**: código, esquemas, datos, credenciales, nombres de clientes, tickets y
   documentos no se pegan en buscadores, asistentes en línea no aprobados, pastebins, generadores de diagramas en línea ni foros.
5. **Consultas en la web con términos genéricos**: documentación pública de un framework o el texto de un error sin rutas, datos ni
   código del proyecto. Nunca se pega código propio.
6. **Fuentes externas = solo lectura y adaptación**: de un proyecto público se toma la idea, se reescribe con las reglas del kit y se
   cita la fuente y su licencia; no se copia ni se ejecuta tal cual.

## Cuando una tarea parece pedir algo externo
El agente se detiene, explica qué necesitaba y por qué y propone la alternativa interna (crear o adaptar la pieza en el repositorio, o
pedir la autorización por Merge Request).

Detección en revisión: `agents/code-reviewer.md` y `agents/security-reviewer.md` marcan como P1 cualquier dependencia, skill, plugin o
script externo no autorizado y cualquier envío de información del proyecto fuera de la organización.
