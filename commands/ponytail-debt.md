# /ponytail-debt

Reúne los atajos marcados en el código en un registro de deuda, para que un atajo temporal no se vuelva permanente sin que nadie lo decida. Solo lee y reporta; no cambia nada.

## Uso

```
/ponytail-debt              # marcadores shortcut: y ponytail:
/ponytail-debt TODO         # otra palabra marcador
/ponytail-debt --owner      # añade el autor de cada línea (git blame)
```

## Qué hace

1. Busca los marcadores en comentarios, respetando `.gitignore` (deja fuera dependencias, compilados y cachés):
   `git grep -nE '(#|//|/[*]|--) ?(shortcut|ponytail):'`
   El prefijo de comentario evita contar texto que solo menciona la convención.
2. Cada coincidencia es una fila. El formato del marcador es `shortcut: <el límite>, <cuándo mejorarlo>`; el límite y la condición se toman del propio comentario.
3. Una fila sin condición de mejora se marca **sin condición**: son las que se quedan para siempre.
4. Con `--owner`, `git blame -L<línea>,<línea>` da el autor.

## Formato de salida

```
src/billing/rfc.ts:41 — límite: solo valida formato, no dígito verificador · mejorar: antes de facturar
memory/cache.py:45 — límite: lista en memoria hasta ~10k registros · mejorar: si crece, consulta paginada
scripts/sync.py:12 — límite: reintento fijo de 3 veces · sin condición

3 marcadores, 1 sin condición.
```

Sin marcadores: `Sin deuda de atajos.`

No se estiman líneas ni tokens ahorrados: la versión sin atajo nunca se escribió, así que no hay base real contra la cual medir.

## Integración con el cierre de sesión

Al terminar la sesión, ejecutar `/ponytail-debt` y llevar las filas nuevas o **sin condición** a `.agent/STATE.md` (sección **Próximos Pasos**) o al backlog.
