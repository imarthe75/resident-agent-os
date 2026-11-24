# Contexto: desarrollo

1. Lee `AGENTS.md` (o `.agent/RULES.md`); carga `reglas-globales`, `estandares-desarrollo` y la skill del stack que vas a tocar.
2. Si el proyecto tiene escáner, consulta los hallazgos abiertos de los archivos a tocar (skill `preflight`).
3. Prueba primero (skill `test-driven-development`): caso que pasa y caso que falla por regla.
4. Código real desde el primer commit; documentación en el mismo cambio (código, OpenAPI, `COMMENT ON`, README).
5. Antes de decir «listo»: pruebas, `python verifiers/run.py` y escáner ejecutados, salida real en la entrega (skill
   `verification-before-completion`).
