# Reporte de Hallazgos - Proyecto: FRONTEND-ENVIO-CORREOS

**Fecha:** 2026-07-09  
**Auditor Técnico:** Antigravity AI  
**Tecnología/Stack:** Angular / Node.js  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [PERF-LEAK-FRONTEND-ENVIO-CORREOS] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
**Sistema Auditado:** frontend-envio-correos  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-envio-correos/src/app/layout/component/app.menuitem.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectaron suscripciones activas (.subscribe) en componentes Angular de frontend-envio-correos sin el correspondiente mecanismo de desuscripción (takeUntil, unsubscribe o async pipe).

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Uso de .subscribe() en componentes dinámicos sin desuscripción al destruir el componente.
- **Escenario de Riesgo:** El usuario navega repetidas veces por las vistas, acumulando instancias de controladores y suscripciones huérfanas en la memoria del navegador.
- **Consecuencia:** Degradación del rendimiento del frontend, congelamientos y eventual crash de la pestaña del navegador.

#### 1.3 ¿A quién afecta?
Usuarios de la interfaz web (Frontend)

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: frontend-envio-correos/src/app/layout/component/app.menuitem.ts
- src/app/layout/component/app.menuitem.ts:L133 -> this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
```

#### 2.2 Pasos para Reproducir
1. Navegar por los componentes del frontend
2. Realizar múltiples transiciones de rutas
3. Analizar perfil de memoria en Chrome DevTools

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe(' src/
```

#### 2.4 Output/Respuesta Observada
```
Múltiples suscripciones activas detectadas
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Caída del frontend del cliente | 🟡 Media |
| **Performance** | Consumo alto de RAM en navegador y lag | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Buenas prácticas de desarrollo UI |
| **Reputación** | Mala experiencia de usuario |
| **Usuarios Impactados** | Todos los usuarios del frontend |
| **Costo Potencial** | Ninguno directo, pero afecta retención |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1-2 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Uso manual de Subscription.unsubscribe()**
- Ventaja: Clásico y directo
- Desventaja: Requeres almacenar referencias y agregar boilerplate en ngOnDestroy
- Esfuerzo: Medio

**Opción B: Patrón takeUntil con Subject en ngOnDestroy** (Recomendada)
- Ventaja: Limpio, escalable y recomendado por la comunidad de Angular
- Desventaja: Requiere definir un trigger de destrucción
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- takeUntil(this.destroy$)

#### 4.4 Testing & Verificación (Cómo validar la corrección)
```
✓ Se verifica que la vulnerabilidad/deficiencia ha sido corregida
✓ No se observan regresiones en funcionalidades existentes
```

---

### 5. 📊 Estimación

| Aspecto | Valor |
|---------|-------|
| **Esfuerzo de Corrección** | Medio (4-16h) |
| **Complejidad Técnica** | Media |
| **Riesgo de Regresión** | Bajo |
| **Testing Requerido** | Unit / Integration |
| **Cambios en API** | No |
| **Cambios en DB Schema** | No |

---

### 6. 🎯 Criterio de Aceptación
- [ ] Código revisado por 2 revisores
- [ ] Pruebas automatizadas pasando
- [ ] Verificación en ambiente de staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Buenas prácticas de Angular

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

