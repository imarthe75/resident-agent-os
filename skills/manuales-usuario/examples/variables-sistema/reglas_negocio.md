# Reglas de negocio — Variables del sistema

> Insumo de la Fase 1. Lo entrega el analista. Fuente: `front/.agents/specs/variables-sistema/especificacion-variables-sistema.md` (§3, §4, §5).
> Escrito como «debería ser»; la Fase 2 lo contrasta contra el código.

| ID | Regla | Fuente |
|---|---|---|
| RN-01 | La tabla se filtra por Nombre, Valor y Tipo. | Especificación §3 |
| RN-02 | Si la variable es de tipo contraseña, su valor nunca se muestra: se ven 10 asteriscos. | Especificación §3, §4.1 |
| RN-03 | La tabla se pagina con 10, 20 o 50 registros por página. | Especificación §3 |
| RN-04 | Nombre, Tipo de valor, Descripción y Valor son obligatorios. | Especificación §3 |
| RN-05 | El nombre se guarda en mayúsculas. | Especificación §3 |
| RN-06 | El nombre solo acepta letras y guion bajo. | Especificación §3 |
| RN-07 | La descripción admite como máximo 200 caracteres. | Especificación §3 |
| RN-08 | Nombre y Tipo de valor no se pueden editar. | Especificación §3, §4.2 |
| RN-09 | Una variable de tipo contraseña se captura dos veces y ambos valores deben coincidir. | Especificación §3, §5 |
| RN-10 | No se permite borrar variables (ni lógico ni físico). | Especificación §4.5 |
| RN-11 | El valor se valida según su tipo: número entero, decimal (hasta 4 decimales), booleano (verdadero/falso), fecha, hora, JSON. | Especificación §3, §4.6 |
| RN-12 | Cada cambio guarda quién y cuándo lo hizo. | Especificación §4.4 |
