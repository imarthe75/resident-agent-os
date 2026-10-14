---
name: postgres-audit-setup
description: Instalar, habilitar y verificar la auditoría estándar de PostgreSQL (bitácora de solo inserción con hash encadenado) mediante el instalador único.
---

# 🕵️ Skill: Auditoría estándar de PostgreSQL

Fuente única: `sql/auditoria_estandar_completo.sql` (instrucciones y alcance verificado en `sql/AUDITORIA_LEEME.md`). Un solo script que **diagnostica la base antes de cambiar nada** y elige la acción; todo va en una transacción.

## 1. Cuándo aplicar
- Al crear una base o un proyecto nuevo.
- Al crear o alterar tablas de aplicación (hay que habilitarles la auditoría).
- Al verificar la integridad de la bitácora.

## 2. Instalación (una vez por base)
Requisitos: PostgreSQL 18+, `psql` 13+, superusuario. Roles `migrator`, `auditor`, `role_dev_dml`, `app_web_user` (los que falten se crean **sin LOGIN**: asígnales LOGIN y contraseña; si el proyecto usa otros nombres, reemplázalos en todo el archivo antes de ejecutar).

```bash
# 1. SIEMPRE primero, en una base que ya pueda tener auditoría:
psql -d <base> -v ON_ERROR_STOP=1 -v solo_diagnostico=si -f sql/auditoria_estandar_completo.sql
# 2. Si el diagnóstico es el esperado:
psql -d <base> -v ON_ERROR_STOP=1 -f sql/auditoria_estandar_completo.sql
```

| Diagnóstico | Acción |
|---|---|
| nueva | instala todo |
| vigente | no cambia nada |
| reparar | restituye piezas faltantes o modificadas; no toca la bitácora |
| anterior | actualiza conservando todos los registros; si el conteo no coincide, revierte |
| ajena | se detiene sin cambiar nada; con `-v ajena=renombrar` conserva lo ajeno e instala el estándar |

**Antes de actualizar una bitácora grande**: la actualización copia todos los registros con la tabla bloqueada; hazlo en una ventana.

## 3. Habilitar la auditoría por tabla
```sql
SELECT auditoria.habilitar_auditoria('<esquema>.<tabla>');   -- lo ejecuta el dueño de la tabla
SELECT * FROM auditoria.reporte_cobertura();                 -- tablas sin cubrir
```
Las tablas creadas por `migrator` reciben `audit_biu` automáticamente; las de otro usuario necesitan `auditoria.asignar_triggers('<esquema>.<tabla>')`. Con PgBouncer en modo transacción: `SELECT set_config('app.current_user', '<usuario>', true);` dentro de cada transacción.

## 4. Verificación (con evidencia, no con suposición)
```sql
INSERT ... / UPDATE ... / DELETE ...                -- sobre una tabla habilitada, en una base de PRUEBA
SELECT * FROM auditoria.log_auditoria ORDER BY 1 DESC LIMIT 5;
SELECT * FROM auditoria.fn_verificar_cadena();      -- sin filas = cadena íntegra
SELECT auditoria_control.fn_verificar_y_anclar();   -- verificación y ancla (diaria con pg_cron)
```
La bitácora debe rechazar `UPDATE`, `DELETE` y `TRUNCATE` incluso al dueño: compruébalo una vez tras instalar.

## 5. Límites declarados (no los ocultes en la entrega)
No se probó en versiones anteriores a PostgreSQL 18, sin los roles `migrator`/`auditor`, con el job de `pg_cron`, ni con una bitácora grande. Con `ajena=renombrar`, las tablas con triggers de la auditoría ajena siguen escribiendo en el esquema renombrado y hay que migrarlas con `asignar_triggers`. Si una bitácora muy antigua no tenía hash, `fn_verificar_cadena()` marcará esos registros (el script avisa con `WARNING` y no los modifica).

## 6. Verificador automático
`python verifiers/run.py --only audit_triggers` comprueba que cada tabla de los `.sql` tenga un trigger de auditoría o una llamada `auditoria.habilitar_auditoria('<esquema>.<tabla>')` (heurístico).
