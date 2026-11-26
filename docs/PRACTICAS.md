# Prácticas de trabajo con agentes de IA

Este documento explica, sin tecnicismos, las prácticas en las que se apoya el kit. No hace falta leerlo para usar el kit (el agente ya
las sigue), pero ayuda a entender por qué el agente pide ciertas cosas y qué revisar cuando entrega.

La idea de fondo es una sola: **un agente de IA escribe rápido, pero se equivoca con seguridad.** Todo lo de abajo sirve para que sus
errores se vean antes de llegar a producción, y para que una persona pueda confiar en lo que entrega sin revisar cada línea a mano.

---

## 1. Primero se escribe qué debe hacer, después se programa
**Qué es.** Antes de tocar código, el agente escribe una especificación corta: qué debe pasar, para quién, qué pasa cuando algo sale mal y
cómo se va a comprobar. Una persona la aprueba. Con eso el agente programa.

**Por qué.** Si al agente le pides «haz el módulo de citas», adivina lo que no le dijiste. Una especificación aprobada le quita las
adivinanzas, y a ti te da algo concreto contra qué revisar.

**Cómo se usa.** Comando `/opsx-propose` (skill `sdd`). Cada requisito se escribe con una forma fija que no deja dudas: «CUANDO el usuario confirma la cita,
EL SISTEMA DEBERÁ enviar el correo de confirmación».

**El carril rápido.** Para cambios pequeños (hasta 5 archivos, sin tocar la base de datos, los contratos de la API ni los permisos), la
especificación es de media página. Pequeño no significa sin rastro: sigue habiendo requisito, prueba y revisión.

## 2. Cada requisito tiene su prueba, y se puede comprobar
**Qué es.** Cada requisito lleva un identificador (`RF-01`) y al menos una prueba que lo menciona.

**Por qué.** Así cualquiera puede responder «¿esto está probado?» sin preguntarle a nadie. Un requisito que ninguna prueba menciona es un
requisito que nadie comprobó.

**Cómo se usa.** El verificador `spec_traceability` revisa que cada requisito aprobado tenga su prueba.

## 3. Pensar desde el inicio cómo sabremos que funciona en producción
**Qué es.** Que una prueba pase demuestra que algo funciona en el ambiente de pruebas. Para saber que sigue funcionando con usuarios
reales hace falta una señal: un contador, un registro, una alerta. A esto se le llama observabilidad, y se diseña junto con el requisito.

**Por qué.** Sin señales, una falla en producción se descubre cuando un usuario llama. Con señales, se descubre antes.

**Cómo se usa.**
- La especificación dice, por cada requisito, qué señal demuestra que funciona y cuándo debe sonar una alerta.
- Todo servicio tiene dos «pulsos»: uno que dice «estoy vivo» sin consultar nada, y otro que dice «estoy listo» porque su base de datos
  responde. Mezclarlos hace que un servicio lento se reinicie sin motivo.
- Cada petición lleva un número de rastreo que aparece en todos sus registros, para seguirla de un servicio a otro.
- Se vigilan cuatro cosas: qué tan lento responde (sobre todo las peticiones más lentas, no solo el promedio), cuánto cuesta, cuántos
  errores hay y, en funciones con IA, cuántas veces dice «no sé».
- Los límites de alerta son números escritos y acordados, no corazonadas.
- Una falla real en producción se convierte en una prueba permanente, para que no vuelva a pasar sin que nadie lo note.
- El verificador `observability_min` revisa que todo servicio tenga sus pulsos y su número de rastreo.

## 4. Revisión por un agente que intenta romperlo
**Qué es.** Cuando el agente termina, otro agente revisa el trabajo con una consigna distinta: no confirmar que funciona, sino encontrar
cómo falla. Compara la especificación con el código, vuelve a correr las pruebas que el primero dice haber corrido y busca casos que nadie
probó.

**Por qué.** Un agente que revisa su propio trabajo tiende a repetir sus propios supuestos. Uno nuevo, de preferencia con otro modelo de
IA, los ve. Y un «las pruebas pasaron» que nadie volvió a correr no es evidencia.

**Cómo se usa.** Comando `/adversarial`, en una sesión distinta a la que hizo el trabajo. Entrega una lista de problemas ordenados por
gravedad y un veredicto: APTO, APTO CON OBSERVACIONES o NO APTO.

**«Mutantes».** Una forma de saber si las pruebas sirven: cambiar a propósito un detalle del código (por ejemplo, un «mayor que» por un
«mayor o igual») y ver si alguna prueba se da cuenta. Si ninguna falla, ese cambio «sobrevivió»: hay una línea que se ejecuta pero que
nadie comprueba de verdad.

## 5. Repetir hasta que quede bien, pero saber cuándo parar
**Qué es.** El agente implementa, otro revisa; si hay problemas graves, se corrigen y revisa un agente nuevo. Se repite hasta que no quedan
problemas graves.

**Por qué parar.** Si una vuelta encuentra exactamente los mismos problemas que la anterior y nada cambió, seguir no sirve: el agente está
atorado. En ese momento se detiene y le pregunta a una persona, en lugar de dar vueltas o marcar cosas como terminadas para salir.

**Cómo se usa.** Lo hace el comando `/team` cuando reparte trabajo entre varios agentes, y el flujo de `/opsx-verify`.

## 6. Nada se cierra sin evidencia
**Qué es.** Antes de cerrar un cambio, el agente ejecuta él mismo una lista fija de comprobaciones (pruebas, el servicio funcionando, la
pantalla si cambió, los verificadores, la revisión independiente, la documentación) y deja un reporte corto de cada una.

**Por qué.** «Ya quedó» no es evidencia; la salida de una prueba sí. Una comprobación que falló o que no se corrió deja la tarea abierta,
aunque el resto esté bien.

**Las excusas de siempre.** El kit trae una tabla con las frases que suelen preceder a un error («es un cambio de una línea», «las pruebas
pasaron ayer», «el otro agente dijo que funciona») y la respuesta a cada una. Si escuchas una de esas frases del agente, pide la evidencia.

## 7. Pensar todos los casos de prueba antes de escribirlos
**Qué es.** Antes de escribir una sola prueba, QA arma la lista completa de casos: el camino feliz, los campos vacíos, los formatos
incorrectos, los límites (uno menos, el exacto, uno más), las reglas del negocio, los errores del servidor, los permisos, el doble clic,
lo que no debe romperse y la accesibilidad básica. Después se prioriza.

**Por qué.** Priorizar sirve para decidir el orden, no para quitar casos. Lo que se deja «para después» se olvida.

**Cómo se usa.** La skill `bdd-spec-driven-development` trae la plantilla del catálogo.

## 8. Mostrarlo funcionando, no contarlo
**Qué es.** El comando `/demo` ejecuta la funcionalidad frente a ti, caso por caso, contra lo que dice la especificación, y termina con
una tabla: qué se esperaba y qué pasó.

**Por qué.** Un resumen dice lo que el agente cree que hizo. Una demostración muestra lo que hace.

## 9. Ciclos cortos y roles que se mezclan
**Qué es.** Con agentes, una tarea se planea, se programa y se revisa en horas. En lugar de un bloque largo de programación con revisión al
final, se trabaja en muchos ciclos cortos, cada uno con su propio cambio pequeño.

**Qué cambia para cada quien.**
- **QA** entra desde el inicio: escribe los casos de prueba mientras se escribe el requisito, y revisa cada cambio pequeño en lugar de
  esperar a que todo esté terminado.
- **Desarrollo** también opina desde el requisito: señala lo que no se puede construir o probar antes de empezar.
- **Diseño** acompaña la construcción, no solo la entrega inicial.
- **Líder de proyecto** mide el avance por lo terminado y revisado, no por lo empezado.

**Lo que no cambia.** La metodología de la organización, sus etapas, sus entregables y quién aprueba cada cosa.

## 10. Cuando el producto usa IA
Si el sistema que construimos llama a un modelo de IA (para clasificar, resumir, estimar):
- **Las pruebas automáticas no llaman al modelo.** Usan respuestas grabadas: así dan siempre el mismo resultado, son rápidas y no cuestan.
- **La calidad del modelo se mide aparte**, con un conjunto fijo de casos de ejemplo cuyo resultado correcto conocemos (como un rango, no
  un número exacto). Al menos uno de esos casos debe ser uno donde lo correcto es responder «no tengo información suficiente».
- **Las cuentas las hace el código, no el modelo:** precios, totales y fechas.
- **El modelo responde, el código decide:** se le pregunta con opciones fijas y su probabilidad; con umbrales escritos y probados, el
  código aplica, aplica marcando para revisión o pasa el caso a una persona.
- **No todo va al modelo más caro:** lo trivial lo resuelven reglas sin modelo, lo intermedio un modelo pequeño y lo complejo o dudoso el
  grande; el ahorro se demuestra comparando contra mandar todo al grande.
- **Si no hay datos, se dice.** Mejor «sin precedente» que una cifra inventada con apariencia de exacta.
- **Lo dudoso se marca para revisión humana** en lugar de descartarse.
- **Se mide el costo de cada paso**, incluidos los intentos que fallaron.

## 11. Saber cuánto cuesta la IA
Toda aplicación que llama a un modelo de IA registra cada llamada: para qué fue, cuántos tokens usó, cuánto tardó y si falló. Así se ve el
costo por tarea y se puede comparar entre proveedores; lo que no se mide no se puede optimizar.

## 12. Siempre las versiones más recientes
Un proyecto nuevo arranca con la última versión estable de cada plataforma y de cada paquete, resuelta ese día y no de memoria; un proyecto
existente revisa sus dependencias cada vez que toca un manifiesto. Si la versión más nueva no es compatible con otra pieza, la herramienta
dice cuál la bloquea y propone la más nueva que sí funciona. Un paquete que su registro marca como «obsoleto» se reemplaza aunque no haya
versión nueva: ya nadie lo corrige.

---

## Glosario
| Término | En pocas palabras |
|---|---|
| Agente de IA | Asistente que no solo responde: lee el proyecto, edita archivos y ejecuta comandos |
| Skill | Guía escrita que el agente carga cuando la tarea la necesita (por ejemplo, cómo hacer un endpoint seguro) |
| Subagente | Otro agente con una tarea acotada, por ejemplo revisar; reporta al agente principal |
| Hook | Acción automática que corre cada vez que el agente hace algo (por ejemplo, revisar la sintaxis al editar) |
| Verificador | Programa que revisa el repositorio y dice CUMPLE, NO CUMPLE o NO EVALUADO |
| Especificación | Documento corto que dice qué debe hacer una funcionalidad y cómo se comprueba |
| Desarrollo dirigido por especificación | Trabajar especificando primero y programando después (prácticas 1 y 2) |
| Observabilidad | Poder saber desde fuera si un sistema funciona bien en producción (práctica 3) |
| Revisión adversaria | Revisión hecha para encontrar fallas, no para confirmar que todo está bien (práctica 4) |
| Mutante | Cambio pequeño hecho a propósito en el código para ver si las pruebas lo detectan |
| p95 | El tiempo por debajo del cual quedan el 95 % de las respuestas; muestra las lentas que el promedio esconde |
| Golden set | Conjunto fijo de casos de ejemplo con su respuesta correcta conocida, para medir un modelo de IA |
| Merge Request (MR) | Solicitud para integrar un cambio al proyecto; la revisa y aprueba una persona distinta del autor |
| Veredicto APTO / NO APTO | Resultado de una revisión: NO APTO si hay algún problema grave; APTO CON OBSERVACIONES si solo hay menores |
