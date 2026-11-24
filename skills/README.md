# Skills

Cada carpeta es una skill (`SKILL.md` con `name` y `description`). Carga siempre `reglas-globales` y `estandares-desarrollo` primero (y `prevencion-hallazgos-seguridad-calidad` al escribir o revisar código; guía por rol en `docs/GUIA_POR_ROL.md`) (plantillas `AGENTS.md`/`CLAUDE.md` en `estandares-desarrollo/templates/`); el resto según la tarea.
Las versiones que aparecen en los ejemplos son de referencia: en un proyecto nuevo se resuelven con `scripts/latest_versions.py`.

| Grupo | Skills |
|---|---|
| Reglas y flujo | `reglas-globales`, `estandares-desarrollo`, `metodologia-entrega`, `documentacion-codigo-y-api`, `manuales-usuario`, `cumplimiento-cmmi-iso`, `clean-code-contract`, `blueprint`, `writing-plans`, `test-driven-development`, `pruebas-mutacion`, `delegacion-subagentes`, `systematic-debugging`, `verification-before-completion`, `using-git-worktrees`, `preflight`, `triage-findings`, `auditoria-codigo`, `prevencion-hallazgos-seguridad-calidad` |
| Backend Spring Boot | `backend-base-spring`, `modulo-crud-estandar`, `backend-modulo-crud`, `backend-endpoint-paginado`, `backend-soporte-api`, `backend-persistencia-jpa`, `backend-seguridad`, `backend-integridad-negocio`, `backend-pruebas-unitarias`, `backend-proyecto-gradle`, `backend-fastapi`, `java-springboot`, `bdd-spec-driven-development` |
| Base de datos | `database-liquibase-postgresql`, `postgres-audit` |
| Frontend Angular + PrimeNG | `theming-tokens`, `primeng21-expert`, `frontend-auth-oidc`, `frontend-heuristicas-usabilidad`, `generacion-componentes-ts`, `generacion-componentes-html`, `generacion-servicios`, `generacion-dtos`, `generacion-estilos`, `generacion-documentacion`, `generacion-pruebas-servicios`, `bdd-frontend-playwright`, `frontend-reordenacion-arquitectonica` |

## Cómo escribir o actualizar una skill
Formato del estándar Agent Skills (agentskills.io); lo leen igual Claude Code y Gemini CLI. Lo comprueba una prueba automática
(`tests/test_skill_descriptions.py`).
- **Encabezado YAML válido:** `name` igual al nombre de la carpeta (minúsculas, números y guiones, máximo 64); `description` sin `<` ni `>`,
  máximo 1024 caracteres y **entre comillas** si contiene «dos puntos y espacio» (si no, el YAML es inválido y el agente ignora la skill).
- **La descripción decide si la skill se usa:** di qué hace **y** cuándo usarla, con las palabras que diría quien la necesita («Úsala cuando
  …»). Los agentes tienden a no cargar una skill si la descripción es vaga.
- **`SKILL.md` corto (menos de ~500 líneas):** lo que siempre aplica va ahí; tablas largas, ejemplos y plantillas van en `references/` y se
  enlazan, para no cargar todo en cada tarea.
- **Instrucciones con el porqué**, no solo «SIEMPRE/NUNCA»: el agente generaliza mejor si sabe qué riesgo evita la regla.
- **Comprobable:** si la skill genera código o documentos, incluye su checklist y, cuando haya regla de escáner, la sección «Reglas del
  escáner que esta skill evita» con filas en `prevencion-hallazgos-seguridad-calidad/references/catalogo-reglas.md`.
- Antes de publicarla, pruébala con 2–3 pedidos reales y compara el resultado con y sin la skill.
