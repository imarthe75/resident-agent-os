# /new-project

Genera un proyecto nuevo **con las versiones vigentes de cada tecnología**, resueltas en el momento, no recordadas.

## Uso
```
/new-project <nombre> [--stack angular,spring-boot,postgresql]
```

## Pasos (en este orden)
1. **Resolver versiones.** Desde la raíz del framework:
   `python scripts/latest_versions.py --write <proyecto>/versions.lock.json`
   - Lee `.agent/versions-policy.json` (qué herramientas, de qué fuente, en qué canal: `latest` o `lts`).
   - Si alguna herramienta sale **NO RESUELTA**, detente y díselo al usuario; no uses una versión de memoria.
2. **Spec primero.** Crea el spec del proyecto en `.agent/SPECS.md` (no hay código sin spec aprobado).
3. **Generar los manifiestos con EXACTAMENTE las versiones del lock** (`package.json`, `pom.xml`/`build.gradle`, `Dockerfile`, `docker-compose.yml`).
   - Imágenes con etiqueta fija (`node:24-alpine`, `pgvector/pgvector:pg18`); nunca `latest`.
   - Java: el canal `compatible` de la política (la más nueva que Spring Boot soporta y que no esté fuera de soporte); la herramienta imprime la razón si una Java más nueva se descarta.
4. **Verificar:** `python verifiers/run.py --path <proyecto> --only versions_current,pk_uuid,compose_volumes` y mostrar la salida real.
5. **Dejar constancia:** copia `versions.lock.json` al repositorio del proyecto y anota en su `.agent/STATE.md` la fecha de resolución.

## Reglas
- Una versión que no aparece en el lock no se usa. Si el usuario pide una distinta (p. ej. quedarse en una LTS anterior), se respeta y se **registra la excepción** y su motivo en el spec.
- Actualizar un proyecto existente es otro comando (`/opsx-propose`): comprueba con `--check versions.lock.json` qué se movió, y no mezcles saltos de versión mayor con cambios funcionales.
