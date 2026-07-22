# Reporte de Hallazgos - Proyecto: FRONT-SSE

**Fecha:** 2026-07-09  
**Auditor Técnico:** Antigravity AI  
**Tecnología/Stack:** Angular / Node.js  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-CORS-FRONT-SSE] Configuración Permisiva de CORS (Wildcard '*')

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Seguridad |
| **Componente Afectado** | front-sse/backend/server.js:40 |
| **CVE/CWE** | CWE-942: Overly Permissive CORS |
| **Normativa Aplicable** | OWASP A05 - Security Misconfiguration |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó el uso de comodín '*' en los orígenes permitidos de CORS en backend/server.js, lo que permite a cualquier dominio realizar peticiones cruzadas a este backend.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Configuración CORS establecida a '*' en backend/server.js.
- **Escenario de Riesgo:** Un sitio malicioso abierto por un usuario autenticado en su navegador podría realizar llamadas no autorizadas al backend usando las credenciales del usuario.
- **Consecuencia:** Fugas de datos sensibles o acciones no autorizadas en nombre del usuario.

#### 1.3 ¿A quién afecta?
API Endpoints

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/backend/server.js:40
'Access-Control-Allow-Origin': '*'
```

#### 2.2 Pasos para Reproducir
1. Abrir backend/server.js
2. Observar la línea 40

#### 2.3 Comando Exacto para Verificar
```bash
cat backend/server.js | grep -n '*'
```

#### 2.4 Output/Respuesta Observada
```
'Access-Control-Allow-Origin': '*'
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Acceso a respuestas de API por dominios externos | 🟠 Alta |
| **Integridad** | Posibilidad de mutaciones CSRF | 🟡 Media |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Falta de cumplimiento OWASP A05 |
| **Reputación** | Medio impacto |
| **Usuarios Impactados** | Todos los usuarios activos en navegadores |
| **Costo Potencial** | Potencial brecha de seguridad |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Restringir orígenes estáticamente**
- Ventaja: Sencillo de implementar
- Desventaja: Poco dinámico
- Esfuerzo: Bajo

**Opción B: Orígenes permitidos cargados dinámicamente de variables** (Recomendada)
- Ventaja: Seguro y flexible por entorno
- Desventaja: Requiere configuración adicional
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- Spring Security CorsConfigurationSource

#### 4.4 Testing & Verificación (Cómo validar la corrección)
```
✓ Se verifica que la vulnerabilidad/deficiencia ha sido corregida
✓ No se observan regresiones en funcionalidades existentes
```

---

### 5. 📊 Estimación

| Aspecto | Valor |
|---------|-------|
| **Esfuerzo de Corrección** | Bajo (<4h) |
| **Complejidad Técnica** | Baja |
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
- CWE-942: Overly Permissive CORS
- OWASP A05 - Security Misconfiguration

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [PERF-LEAK-FRONT-SSE] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | front-sse/src/app/pages/notification-test/notification-test.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectaron suscripciones activas (.subscribe) en componentes Angular de front-sse sin el correspondiente mecanismo de desuscripción (takeUntil, unsubscribe o async pipe).

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
// Ubicación: front-sse/src/app/pages/notification-test/notification-test.component.ts
- src/app/pages/notification-test/notification-test.component.ts:L183 -> }).subscribe({
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

