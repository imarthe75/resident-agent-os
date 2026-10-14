# Versiones de tecnología

1. Las versiones de un proyecto nuevo se **resuelven** con `scripts/latest_versions.py` el día que se genera; no se copian de otro proyecto ni de la memoria.
2. En los manifiestos van **exactas** y fijas; nunca `latest`, `*` ni rangos abiertos en dependencias de ejecución.
3. LTS para lo que el proveedor soporta por años (Java, Node) según `.agent/versions-policy.json`; la última estable para el resto. Cambiar el canal es una decisión de política, no de código.
4. Desviarse (quedarse en una versión anterior) exige excepción escrita en el spec: qué, por qué, hasta cuándo.
5. `python verifiers/run.py --only versions_current` lo comprueba; un `NO_EVALUADO` por falta de red no es un cumplimiento.
