# Compuertas de cierre de etapa

Cada punto se responde con **evidencia** (enlace al artefacto, merge request, salida de pruebas o reporte) o con **`no aplica: <motivo>`**
según el registro de adaptación. Un punto marcado ★ es crítico: sin él la etapa no cierra; lo verifica alguien distinto de quien lo hizo.

## Etapa 1 · Requerimientos
- [ ] ★ Cada requerimiento tiene sus seis campos y criterios comprobables.
- [ ] ★ La matriz de trazabilidad tiene todos los requerimientos con su origen.
- [ ] Requisitos del contrato no funcionales registrados con su forma de medirlos.
- [ ] Estimación base con su método y supuestos.
- [ ] Primera versión de los casos de aceptación derivada de los criterios.
- [ ] ★ Requerimientos y plan base aprobados por el cliente.

## Etapa 2 · Diseño
- [ ] ★ Cada elemento de diseño traza a un requerimiento.
- [ ] Decisiones de arquitectura con ADR (alternativas y consecuencias).
- [ ] Modelo de datos con el visto bueno del especialista de BD.
- [ ] Contratos de API definidos (OpenAPI o equivalente).
- [ ] Con interfaz: prototipo aprobado, especificación de campos y validaciones, revisión de accesibilidad del diseño.
- [ ] ★ Excepciones al catálogo tecnológico resueltas antes de mostrar nada al cliente.

## Etapa 3 · Construcción y verificación
- [ ] ★ Todo el código entró por merge request revisado por otra persona.
- [ ] ★ CI en verde en la rama a entregar.
- [ ] Pruebas unitarias e integración de cada regla (caso que pasa y caso que falla; 401/403/409 en la API).
- [ ] ★ Sin hallazgos nuevos de severidad crítica o alta en el análisis de seguridad (o con su decisión documentada).
- [ ] Documentación del código, del API y de la base de datos en el mismo cambio.
- [ ] Con interfaz: cada pantalla contra el diseño aprobado y recorrida solo con teclado.
- [ ] Versión etiquetada del incremento.

## Etapa 4 · Aceptación del usuario
- [ ] Casos de aceptación conciliados con lo vigente antes de entregarlos.
- [ ] ★ Ejecutados por el usuario con su registro.
- [ ] Cada hallazgo clasificado (defecto · cambio · zona gris) con evidencia; los cambios fueron a control de cambios.
- [ ] ★ Acta de aceptación firmada o lista de defectos con plan.

## Etapa 5 · Despliegue y cierre
- [ ] ★ Runbook verificable ejecutado (cada paso con su verificación).
- [ ] ★ Rollback probado antes del despliegue.
- [ ] ★ El paquete de entrega no incluye credenciales.
- [ ] Con interfaz: manual de usuario contrastado contra el sistema.
- [ ] Acta de despliegue y de entrega; inicio de garantía registrado.
- [ ] Lecciones aprendidas desde la bitácora de seguimiento; estimado contra real.
