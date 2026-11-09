---
name: cumplimiento-cmmi-iso
description: Cómo un equipo de desarrollo produce, en su trabajo diario, la evidencia verificable para CMMI V3.0 (áreas de práctica) e ISO/IEC 27001:2022 (controles tecnológicos del Anexo A) — trazabilidad, revisión por pares, CI, versiones, migraciones, contratos de API, ADR — y qué NO puede acreditar un agente. Úsala al planear un proyecto, preparar un MR o responder qué falta para una auditoría.
---

# Cumplimiento CMMI V3.0 e ISO 27001 en el desarrollo

El agente no «cumple» ni declara porcentajes: hace que el flujo de trabajo deje evidencia que una auditoría o un escáner pueda verificar,
y declara `NO EVALUADO` lo que depende de documentos o decisiones que no existen (`rules/common/compliance.md`, `rules/common/honesty.md` §4).

## 1. Evidencia que el desarrollo sí produce
| Área CMMI V3.0 | Evidencia verificable en repositorio/pipeline | Cómo la produce el equipo |
|---|---|---|
| RDM Requisitos | Cada commit/MR referencia un requisito con criterio de aceptación | Rama y título del MR con el id del requisito; criterio de aceptación en la descripción |
| PR Revisión por pares | MR fusionados con revisor distinto del autor | Aprobación obligatoria en la rama protegida; comentarios de revisión reales |
| VV Verificación y validación | Pruebas existentes y último pipeline en verde | CI con pruebas; caso positivo y negativo por regla; pruebas de 401/403/409 |
| PI Integración | Contrato OpenAPI publicado; pruebas de integración | springdoc + Testcontainers |
| CM Gestión de configuración | Historial real, tags por entrega, rama por defecto protegida, esquema versionado | Merge Requests, `git tag vX.Y.Z`, Liquibase/Flyway |
| TS Solución técnica | `docs/` con arquitectura y diseño de datos versionado | Documento de arquitectura y migraciones |
| DAR Decisiones | ADR en `DECISIONS/` | Un ADR por decisión técnica relevante |
| CAR Análisis causal | Lección registrada tras un defecto relevante | ADR o bitácora con causa raíz y acción |

**Solo con documento real (el agente no lo inventa):** planeación (PLAN), estimación (EST), monitoreo (MC), riesgos (RSK), capacitación
(OT), gobierno (GOV), medición (MPM), activos y procesos de la organización (PAD, PCM, II), aseguramiento de calidad formal (PQA). Si el
documento no existe, el estado es `NO EVALUADO`.

## 2. Controles ISO/IEC 27001:2022 que el código y el pipeline evidencian
| Control | Qué se hace en el código o el pipeline |
|---|---|
| 8.4 Acceso al código fuente | Repositorio privado, ramas protegidas, permisos mínimos |
| 8.5 Autenticación segura | OIDC delegado, MFA en el proveedor, sin credenciales propias en la app |
| 8.8 Vulnerabilidades técnicas | Escaneo de dependencias y código en cada MR; actualización de versiones |
| 8.9 Gestión de configuración | Configuración por ambiente, sin secretos, `ddl-auto=none` |
| 8.15 Registro (logging) | Auditoría de cambios de datos en BD y de eventos de negocio; logs sin datos sensibles |
| 8.24 Criptografía | AES-GCM, TLS, sin algoritmos débiles; llaves en gestor de secretos |
| 8.25 Ciclo de desarrollo seguro | Requisitos trazables, revisión, pruebas y escaneo como compuertas del pipeline |
| 8.28 Codificación segura | Reglas por lenguaje (`rules/`), cero hallazgos nuevos del escáner |
| 8.29 Pruebas de seguridad | Pruebas de autorización por rol y escaneo en CI |
| 8.32 Gestión de cambios | Todo cambio por MR revisado; tags; migraciones versionadas |

Los controles organizacionales, de personas y físicos (secciones 5, 6 y 7 del Anexo A) no se acreditan desde el código.

## 3. Lista para cada Merge Request
- [ ] Título/rama con el id del requisito; criterio de aceptación en la descripción.
- [ ] Pruebas nuevas o actualizadas (caso positivo y negativo) y pipeline en verde.
- [ ] Escaneo de seguridad sin hallazgos nuevos (o «no verificado por escáner»).
- [ ] Documentación actualizada: Javadoc/TSDoc, OpenAPI, `COMMENT ON`, README, ADR si cambió una decisión (skill `documentacion-codigo-y-api`).
- [ ] Revisor asignado distinto del autor.

## 4. Reglas
- Ningún porcentaje de cumplimiento sin las comprobaciones que lo sustentan; nunca se ajusta el denominador.
- La revisión por pares la hace una persona; la aprobación de un agente no cuenta como revisión.
- Una auditoría formal CMMI exige el modelo completo de ISACA; lo que mide un escáner es un indicador interno.

## Reglas del escáner que esta skill evita
`GITLAB-PROJECT-MR-NO-PIPELINE-GATE`, `GITLAB-PROJECT-DEFAULT-BRANCH-UNPROTECTED`, `CICD-NO-PIPELINE`, `CICD-GATE-ALLOW-FAILURE`, `SCA-LICENSE-UNKNOWN`, `API-NO-CONTRACT`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
