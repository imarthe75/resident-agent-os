# Mapa del proyecto (MAP.md)

*Plantilla: se actualiza cuando cambia la estructura. Los puertos y rutas de abajo son los del propio framework.*

## Estructura del framework
```
.agent/        estado cognitivo del agente (leyes, contexto, heurísticas, specs, estado, perfil, compuertas)
agent/         bucle de ejecución, motor de heurísticas, decisiones tipadas, specs, validación humana, compuertas
memory/        caché (Valkey) y memoria de largo plazo (PostgreSQL + pgvector)
verifiers/     verificadores de restricciones (CUMPLE / NO_CUMPLE / NO_EVALUADO)
rules/ skills/ commands/ agents/ contexts/ prompts/   reglas, skills, comandos, personajes y prompts versionados
scripts/       hooks, distribución con detección de deriva, versiones vigentes, validación de prompts
resident-ui/   panel de monitoreo (Next.js)
sql/           esquema de memoria y de auditoría
tests/         pruebas
```

## Servicios locales (docker-compose.yml)
| Servicio | Puerto host | Volumen | Propósito |
| :--- | :---: | :--- | :--- |
| **agent-cache** (Valkey) | `127.0.0.1:6379` | `./data/valkey` | Memoria de corto plazo y caché |
| **agent-db** (PostgreSQL + pgvector) | `127.0.0.1:5432` | `./data/postgres` | Memoria de largo plazo |
| **resident-ui** | `127.0.0.1:3000` | — | Panel del agente |

Los proyectos que usen el framework añaden aquí **su** estructura y servicios.
