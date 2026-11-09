---
name: estandares-desarrollo
description: Estándares obligatorios de desarrollo para cualquier proyecto y lenguaje — código real, documentación (código, OpenAPI, base de datos), seguridad verificada, base de datos con auditoría, reglas por lenguaje (Java/Spring Boot, Angular/TypeScript, Python, SQL) y evidencia CMMI/ISO — con la skill que aplica en cada caso y plantillas AGENTS.md/CLAUDE.md para la raíz del proyecto. Cárgala junto con reglas-globales al iniciar trabajo en un proyecto.
---

# Estándares de desarrollo

## Obligatorio en todo cambio
| Tema | Regla mínima | Detalle |
|---|---|---|
| Código real | Sin datos simulados, maquetas, `TODO` ni funciones vacías en el código de la aplicación; mocks solo en pruebas | `reglas-globales` §2.1 |
| Documentación | Javadoc/TSDoc/docstring en API pública; OpenAPI completo en cada endpoint; `COMMENT ON` en BD; README por módulo; ADR por decisión | `documentacion-codigo-y-api` |
| Seguridad | Secretos fuera del código; autenticación OIDC; autorización en cada endpoint; validación de entrada; errores sin fuga; cero hallazgos nuevos del escáner | `prevencion-hallazgos-seguridad-calidad`, `backend-seguridad`, `frontend-auth-oidc`, `clean-code-contract` |
| Base de datos | Migraciones idempotentes; PK `uuidv7()`; `timestamptz`, `jsonb`, `numeric`; columnas y triggers de auditoría | `database-liquibase-postgresql`, `postgres-audit` |
| Pruebas | Caso positivo y negativo por regla; 401/403/409 en API; contra servicios reales desechables | `test-driven-development`, `backend-pruebas-unitarias`, `generacion-pruebas-servicios` |
| Proceso | Requisito trazable, MR revisado por otra persona, CI en verde, tags, ADR | `cumplimiento-cmmi-iso` |
| Entrega | Estado honesto con evidencia ejecutada | `verification-before-completion` |

## Qué skill cargar según la tarea
| Tarea | Skills |
|---|---|
| Endpoint o módulo Spring Boot | `backend-base-spring`, `backend-modulo-crud` / `backend-endpoint-paginado`, `backend-soporte-api`, `backend-persistencia-jpa`, `documentacion-codigo-y-api` |
| Pantalla Angular | `primeng21-expert` (tabla de ruteo), `generacion-componentes-ts`/`-html`, `generacion-servicios`, `frontend-heuristicas-usabilidad` |
| Migración SQL | `database-liquibase-postgresql`, `postgres-audit` |
| Pruebas | `backend-pruebas-unitarias`, `bdd-spec-driven-development`, `bdd-frontend-playwright`, `generacion-pruebas-servicios` |
| Cualquier código, configuración, SQL, Dockerfile o pipeline | `prevencion-hallazgos-seguridad-calidad` (reglas del escáner y lista de chequeo antes de entregar) |
| Plan o cambio grande | `blueprint`, `writing-plans`, `preflight` |
| Error o prueba que falla | `systematic-debugging` |

Reglas por lenguaje (lo que el escáner verifica): `rules/java/rules.md`, `rules/angular/rules.md`, `rules/typescript/rules.md`,
`rules/python/rules.md`, `rules/common/*.md`.

## Plantillas para la raíz del proyecto
- [`templates/AGENTS.md`](templates/AGENTS.md): instrucciones para cualquier agente (Codex, Gemini, Copilot…). Cópiala a la raíz y llena
  la sección «Proyecto».
- [`templates/CLAUDE.md`](templates/CLAUDE.md): versión para Claude Code; apunta a `AGENTS.md` para no duplicar reglas.
