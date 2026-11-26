# Versiones de tecnología

1. Las versiones de un proyecto nuevo se **resuelven** con `scripts/latest_versions.py` el día que se genera; no se copian de otro proyecto ni de la memoria.
2. En los manifiestos van **exactas** y fijas; nunca `latest`, `*` ni rangos abiertos en dependencias de ejecución.
3. **La última versión final que funcione**, no solo la más nueva publicada: canal `latest` (última estable), `lts` o `compatible` (la más nueva que el resto del stack soporta; p. ej. Java según Spring Boot, TypeScript según typescript-eslint). Si una versión final se descarta, la herramienta dice por qué y cambia sola cuando el stack la alcance. Cambiar el canal es una decisión de política (`.agent/versions-policy.json`), no de código.
4. Desviarse (quedarse en una versión anterior) exige excepción escrita en el spec: qué, por qué, hasta cuándo.
5. **Todas las dependencias directas**, no solo las plataformas, van en la última versión estable compatible:
   `python scripts/outdated_dependencies.py --path . --strict` al crear un proyecto (debe terminar en 0) y al tocar un manifiesto. En npm la
   compatibilidad sale de los rangos de *peer dependencies*; en Maven, Gradle y Python la deciden la compilación y las pruebas.
6. Una dependencia marcada **obsoleta** en su registro se reemplaza aunque no exista versión nueva: ya no tiene soporte.
7. `python verifiers/run.py --only versions_current,dependencies_current` lo comprueba (falla con atraso de versión mayor o menor, o con una
   dependencia obsoleta; el atraso de parche se lista). Un `NO_EVALUADO` por falta de red o por un registro privado no es un cumplimiento.
