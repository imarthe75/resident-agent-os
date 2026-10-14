# Contexto del proyecto (CONTEXT.md)

*Plantilla: cada proyecto que use este framework la llena con su propio contexto. El framework no asume ningún producto ni organización.*

## Propósito
- **Qué es este proyecto:** _pendiente_
- **Quién lo usa y para qué:** _pendiente_
- **Qué NO es / fuera de alcance:** _pendiente_

## Infraestructura que usa
Los servicios de memoria del propio agente están en `docker-compose.yml`:
- **Memoria de corto plazo:** Valkey (`agent-cache`), datos en `./data/valkey`.
- **Memoria de largo plazo:** PostgreSQL + pgvector (`agent-db`), datos en `./data/postgres`, esquema en `sql/agent_memory.sql`.

Servicios propios del proyecto (base de datos de negocio, identidad, secretos, colas): _declararlos aquí con su dueño; no copiar credenciales._

## Perfil del proyecto
La parte verificable (ciclo de vida, módulos, interfaz, base reutilizable) vive en `.agent/PROFILE.json`.
