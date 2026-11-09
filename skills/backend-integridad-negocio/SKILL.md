---
name: backend-integridad-negocio
description: Patrones para proteger la integridad de los datos desde la capa de servicio — validación proactiva de dependientes antes de inactivar o borrar, unicidad con 409, consecutivos y folios sin duplicados en concurrencia, bitácora de solo agregar, y máquina de estados de 3 pasos para tokens de verificación (2FA, correo, SMS) resistente a reintentos, fuerza bruta y reuso. Úsala junto con el catálogo de reglas de negocio del módulo (`rules/common/business-rules.md`).
---

# Backend Integridad de Negocio

## 1. Escudo de integridad (validar antes, no reaccionar al error de la BD)
Antes de inactivar, borrar o reducir un catálogo maestro, el servicio comprueba que no haya registros activos que dependan de él.

1. El usuario intenta inactivar una entidad maestra.
2. El servicio ejecuta un `existsBy...`/`count` sobre el repositorio dependiente filtrando `activo = true AND borrado = false`.
3. Si hay dependientes: `GenericErrorException("No se puede inactivar: existen N registros activos que la usan", CODE_CONFLICT)` → 409.

- La llave foránea sigue existiendo en la BD: el escudo da un mensaje claro, la FK garantiza la regla.
- Unicidad: validar en el servicio (409 con mensaje claro) **y** con índice único parcial en la BD (`WHERE borrado = false`),
  porque dos peticiones simultáneas pueden pasar la validación a la vez.

## 2. Tokens de verificación: máquina de 3 pasos
Nunca un solo paso «generar y validar».

1. **Solicitar:** genera el código con `SecureRandom`, guarda **solo su hash** (SHA-256 con sal o HMAC), con expiración corta
   (5–10 min), contador de intentos y el contexto (usuario, operación). Invalida los códigos anteriores del mismo contexto. Límite de
   solicitudes por usuario/IP.
2. **Verificar (opcional, para la UI):** compara en tiempo constante (`MessageDigest.isEqual`), incrementa intentos fallidos, bloquea al
   superar el máximo (p. ej. 5). **No** consume el token.
3. **Validar y consumir:** justo antes de la operación crítica, dentro de la misma transacción: vigente, no consumido, intentos bajo el
   límite y contexto coincidente → marcar como consumido (`UPDATE ... WHERE consumido = false` y comprobar filas afectadas) y continuar.
   Evita reuso (replay) y doble consumo concurrente.

- El código nunca viaja en la URL ni se registra en logs.
- Mismo mensaje de error para «código incorrecto» y «código expirado» (no dar pistas).

## 3. Folios y consecutivos sin duplicados
- Obtener el contador con bloqueo (`@Lock(PESSIMISTIC_WRITE)` / `SELECT ... FOR UPDATE`), o con una secuencia, o con
  `UPDATE contador SET n = n + 1 WHERE ... RETURNING n`; nunca «leer el máximo y sumar 1» sin bloqueo.
- `UNIQUE` sobre el folio emitido: si algo falla, la base lo impide.
- La capacidad del consecutivo (`n ≤ 10^longitud − 1`) se valida antes de emitir; el reinicio anual usa una zona horaria explícita.

## 4. Bitácora y auditoría
- Solo agregar: ningún endpoint ni servicio actualiza o borra registros de bitácora; la consulta está restringida por rol.
- La verificación de integridad reporta el fallo sin modificar el registro original.

## Checklist
- [ ] Inactivar/borrar valida dependientes activos; unicidad con índice parcial + 409.
- [ ] Tokens: hash guardado, expiración, intentos máximos, comparación en tiempo constante, consumo atómico.
- [ ] Folios con bloqueo o secuencia y `UNIQUE`; bitácora sin actualización ni borrado.
- [ ] Pruebas: dependiente activo bloquea; código reusado o vencido falla; sexto intento bloqueado; dos emisiones simultáneas dan folios distintos.

## Reglas del escáner que esta skill evita
`SEQUENTIAL-FOLIO-FROM-MAX`, `JPA-ENTITY-MISSING-VERSION`, `JPA-MULTI-WRITE-NO-TRANSACTIONAL`, `SWALLOWED-ERROR`.
Corrección de cada una y el resto del catálogo: skill `prevencion-hallazgos-seguridad-calidad`.
