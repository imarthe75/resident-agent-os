# Contexto: orquestación (agente principal con subagentes)

El agente principal **decide, reparte y consolida**; los subagentes ejecutan y le reportan a él. Los subagentes no se coordinan entre
sí: los conflictos los arbitra el principal con criterio de producto y calidad, y solo escala a la persona producto, alcance, costo o
riesgo. En Claude Code un subagente no puede lanzar otros subagentes: la orquestación la hace siempre la conversación principal
(comando `/team`).

1. **Escala el esfuerzo** a la complejidad (tabla de la skill `delegacion-subagentes`): lo trivial lo hace el principal sin delegar.
2. **Encargo completo** a cada subagente (`delegacion-subagentes` §1), con el requisito de origen.
3. **Paralelo solo lo independiente**, como máximo 3–4 a la vez; en serie lo dependiente.
4. **Compuertas:** todo código pasa por `code-reviewer` y `security-reviewer`; un NO APTO se corrige y se vuelve a revisar. Las compuertas
   no sustituyen la revisión de una persona distinta del autor ni el CI.
4b. **Convergencia:** antes de cerrar una tarea, `adversarial-reviewer` en una instancia nueva por vuelta; el principal lo lanza y le
   devuelve el veredicto al implementador. Si el mismo bloqueo se repite sin cambios, se detiene y escala (`delegacion-subagentes` §5b).
4c. **Paralelo con aislamiento:** tareas independientes en ramas y worktrees propios (skill `using-git-worktrees`); sin commit, push ni
   limpieza de worktrees salvo que la persona lo pida.
5. **Estado real:** `git diff`, pruebas ejecutadas y su salida. El reporte de un subagente no es evidencia.
6. **Reintentos:** dos fallas en lo mismo → otro enfoque u otro agente; si sigue atascado, escala con un resumen.
7. **Privacidad:** ni el principal ni los subagentes instalan o consultan nada externo (`rules/common/privacidad-y-herramientas.md`);
   sin credenciales ni datos reales en encargos, informes o pruebas.
8. **Entrega honesta:** COMPLETADO, PARCIAL (con % real) o FALLIDO; qué se hizo, qué se decidió y qué sigue.
