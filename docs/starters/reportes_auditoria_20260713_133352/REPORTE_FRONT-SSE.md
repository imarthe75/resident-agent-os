# Reporte de Hallazgos - Proyecto: FRONT-SSE

**Fecha:** 2026-07-13  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-CORS-FRONT-SSE] Configuración Permisiva de CORS (Wildcard '*')

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Seguridad |
| **Componente Afectado** | front-sse/backend/server.js:40 |
| **CVE/CWE** | CWE-942: Overly Permissive CORS |
| **Normativa Aplicable** | OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó el uso de comodín '*' en los orígenes permitidos de CORS en backend/server.js.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Uso de origin * en la configuración de CORS.
- **Escenario de Riesgo:** Un sitio malicioso podría forzar peticiones cruzadas a la API.
- **Consecuencia:** Fugas de datos sensibles o acciones no autorizadas.

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
| **Confidencialidad** | Media | 🟠 Alta |
| **Integridad** | Baja | 🟡 Media |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Falta de cumplimiento OWASP A05 |
| **Reputación** | Medio |
| **Usuarios Impactados** | Usuarios en navegadores |
| **Costo Potencial** | Bajo |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Estático**
- Ventaja: Sencillo
- Desventaja: Poco dinámico
- Esfuerzo: Bajo

**Opción B: CORS Dinámico por perfiles** (Recomendada)
- Ventaja: Seguro
- Desventaja: Requiere configuración
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- CorsConfigurationSource de Spring

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
'Access-Control-Allow-Origin': '*'
```

**Código Corregido / Solución:**
```
// Reemplazar wildcard '*' por orígenes de confianza autorizados
corsRegistry.addMapping("/**").allowedOrigins("https://trusted-domain.com");
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-942: Overly Permissive CORS
- OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONT-SSE] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | front-sse/src/app/pages/notification-test/notification-test.component.ts:183 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/notification-test/notification-test.component.ts.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Subscripción abierta sin onDestroy / unsubscribe / takeUntil.
- **Escenario de Riesgo:** Navegación repetida acumula subscripciones en memoria de la pestaña del navegador.
- **Consecuencia:** Congelamientos y eventual caída de la UI.

#### 1.3 ¿A quién afecta?
Usuarios de navegador

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/pages/notification-test/notification-test.component.ts:183
}).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/notification-test/notification-test.component.ts
2. Observar la línea 183

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
}).subscribe({
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Media | 🟡 Media |
| **Performance** | Consumo de RAM alto | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de diseño frontend |
| **Reputación** | Inestabilidad visual |
| **Usuarios Impactados** | Usuarios finales |
| **Costo Potencial** | Ninguno |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1-2 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Unsubscribe manual**
- Ventaja: Fácil
- Desventaja: Boilerplate
- Esfuerzo: Medio

**Opción B: Patrón takeUntil con trigger** (Recomendada)
- Ventaja: Limpio y escalable
- Desventaja: Estructura adicional
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- takeUntil(this.destroy$)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
}).subscribe({
```

**Código Corregido / Solución:**
```
// Usar operador takeUntil con subject de destrucción
private destroy$ = new Subject<void>();

this.service.getData().pipe(takeUntil(this.destroy$)).subscribe(...);

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Buenas prácticas de Angular

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONT-SSE] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | front-sse/src/app/layout/component/app.menuitem.ts:133 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/layout/component/app.menuitem.ts.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Subscripción abierta sin onDestroy / unsubscribe / takeUntil.
- **Escenario de Riesgo:** Navegación repetida acumula subscripciones en memoria de la pestaña del navegador.
- **Consecuencia:** Congelamientos y eventual caída de la UI.

#### 1.3 ¿A quién afecta?
Usuarios de navegador

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/layout/component/app.menuitem.ts:133
this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/layout/component/app.menuitem.ts
2. Observar la línea 133

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Media | 🟡 Media |
| **Performance** | Consumo de RAM alto | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de diseño frontend |
| **Reputación** | Inestabilidad visual |
| **Usuarios Impactados** | Usuarios finales |
| **Costo Potencial** | Ninguno |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1-2 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Unsubscribe manual**
- Ventaja: Fácil
- Desventaja: Boilerplate
- Esfuerzo: Medio

**Opción B: Patrón takeUntil con trigger** (Recomendada)
- Ventaja: Limpio y escalable
- Desventaja: Estructura adicional
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- takeUntil(this.destroy$)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
```

**Código Corregido / Solución:**
```
// Usar operador takeUntil con subject de destrucción
private destroy$ = new Subject<void>();

this.service.getData().pipe(takeUntil(this.destroy$)).subscribe(...);

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Buenas prácticas de Angular

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONT-SSE] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | front-sse/src/app/pages/crud/crud.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/crud/crud.ts presenta una complejidad cognitiva estimada de 25, superando el umbral recomendado de 15.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).
- **Escenario de Riesgo:** Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.
- **Consecuencia:** Mayor probabilidad de introducir bugs en modificaciones futuras.

#### 1.3 ¿A quién afecta?
Equipo de Desarrollo / Pruebas QA

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/pages/crud/crud.ts
Línea 26: customExportHeader?: string;
Línea 61: <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedProducts()" [disabled]="!selectedProducts || !selectedProducts.length" />
Línea 154: <label for="name" class="block font-bold mb-3">Name</label>
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/crud/crud.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/crud/crud.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 25
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Riesgo de bugs alto | 🟡 Media |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de calidad de código |
| **Reputación** | Tiempos de entrega lentos |
| **Usuarios Impactados** | Desarrolladores |
| **Costo Potencial** | Deuda técnica acumulada |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 3 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Refactorizar método**
- Ventaja: Mantenible
- Desventaja: Esfuerzo medio
- Esfuerzo: Medio

**Opción B: Extraer a submétodos puros** (Recomendada)
- Ventaja: Código limpio y testeable
- Desventaja: Requiere pruebas de regresión
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Extract Method Refactoring Pattern

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Línea 26: customExportHeader?: string;
Línea 61: <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedProducts()" [disabled]="!selectedProducts || !selectedProducts.length" />
Línea 154: <label for="name" class="block font-bold mb-3">Name</label>
```

**Código Corregido / Solución:**
```
// Refactorización Recomendada:
// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.
// Ejemplo:
// public void procesar() {
//   if (condicion) {
//     hacerSubProceso();
//   }
// }
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Clean Code / Principios de Mantenibilidad

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONT-SSE] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | front-sse/src/app/pages/uikit/tabledemo.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/uikit/tabledemo.ts presenta una complejidad cognitiva estimada de 36, superando el umbral recomendado de 15.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).
- **Escenario de Riesgo:** Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.
- **Consecuencia:** Mayor probabilidad de introducir bugs en modificaciones futuras.

#### 1.3 ¿A quién afecta?
Equipo de Desarrollo / Pruebas QA

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/pages/uikit/tabledemo.ts
Línea 244: <button pButton icon="pi pi-fw {{ isExpanded ? 'pi-minus' : 'pi-plus' }}" label="{{ isExpanded ? 'Collapse All' : 'Expand All' }}" (click)="expandAll()"></button>
Línea 261: <p-button type="button" pRipple [pRowToggler]="product" [text]="true" [rounded]="true" [plain]="true" [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
Línea 281: <h5>Orders for {{ product.name }}</h5>
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/uikit/tabledemo.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/uikit/tabledemo.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 36
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Riesgo de bugs alto | 🟡 Media |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de calidad de código |
| **Reputación** | Tiempos de entrega lentos |
| **Usuarios Impactados** | Desarrolladores |
| **Costo Potencial** | Deuda técnica acumulada |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 3 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Refactorizar método**
- Ventaja: Mantenible
- Desventaja: Esfuerzo medio
- Esfuerzo: Medio

**Opción B: Extraer a submétodos puros** (Recomendada)
- Ventaja: Código limpio y testeable
- Desventaja: Requiere pruebas de regresión
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Extract Method Refactoring Pattern

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Línea 244: <button pButton icon="pi pi-fw {{ isExpanded ? 'pi-minus' : 'pi-plus' }}" label="{{ isExpanded ? 'Collapse All' : 'Expand All' }}" (click)="expandAll()"></button>
Línea 261: <p-button type="button" pRipple [pRowToggler]="product" [text]="true" [rounded]="true" [plain]="true" [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
Línea 281: <h5>Orders for {{ product.name }}</h5>
```

**Código Corregido / Solución:**
```
// Refactorización Recomendada:
// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.
// Ejemplo:
// public void procesar() {
//   if (condicion) {
//     hacerSubProceso();
//   }
// }
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Clean Code / Principios de Mantenibilidad

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONT-SSE] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | front-sse/src/app/pages/service/product.service.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/service/product.service.ts presenta una complejidad cognitiva estimada de 16, superando el umbral recomendado de 15.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).
- **Escenario de Riesgo:** Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.
- **Consecuencia:** Mayor probabilidad de introducir bugs en modificaciones futuras.

#### 1.3 ¿A quién afecta?
Equipo de Desarrollo / Pruebas QA

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/pages/service/product.service.ts
Línea 10: id?: string;
Línea 11: code?: string;
Línea 12: name?: string;
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/service/product.service.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/service/product.service.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 16
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Riesgo de bugs alto | 🟡 Media |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de calidad de código |
| **Reputación** | Tiempos de entrega lentos |
| **Usuarios Impactados** | Desarrolladores |
| **Costo Potencial** | Deuda técnica acumulada |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 3 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Refactorizar método**
- Ventaja: Mantenible
- Desventaja: Esfuerzo medio
- Esfuerzo: Medio

**Opción B: Extraer a submétodos puros** (Recomendada)
- Ventaja: Código limpio y testeable
- Desventaja: Requiere pruebas de regresión
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Extract Method Refactoring Pattern

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Línea 10: id?: string;
Línea 11: code?: string;
Línea 12: name?: string;
```

**Código Corregido / Solución:**
```
// Refactorización Recomendada:
// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.
// Ejemplo:
// public void procesar() {
//   if (condicion) {
//     hacerSubProceso();
//   }
// }
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Clean Code / Principios de Mantenibilidad

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONT-SSE] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | front-sse/src/app/pages/notification-test/notification-test.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/notification-test/notification-test.component.ts presenta una complejidad cognitiva estimada de 38, superando el umbral recomendado de 15.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).
- **Escenario de Riesgo:** Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.
- **Consecuencia:** Mayor probabilidad de introducir bugs en modificaciones futuras.

#### 1.3 ¿A quién afecta?
Equipo de Desarrollo / Pruebas QA

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/pages/notification-test/notification-test.component.ts
Línea 67: if (!user) {
Línea 77: if (this.eventSource) {
Línea 90: let displayType = data.type || data.messageType || 'Info';
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/notification-test/notification-test.component.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/notification-test/notification-test.component.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 38
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Riesgo de bugs alto | 🟡 Media |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de calidad de código |
| **Reputación** | Tiempos de entrega lentos |
| **Usuarios Impactados** | Desarrolladores |
| **Costo Potencial** | Deuda técnica acumulada |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 3 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Refactorizar método**
- Ventaja: Mantenible
- Desventaja: Esfuerzo medio
- Esfuerzo: Medio

**Opción B: Extraer a submétodos puros** (Recomendada)
- Ventaja: Código limpio y testeable
- Desventaja: Requiere pruebas de regresión
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Extract Method Refactoring Pattern

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Línea 67: if (!user) {
Línea 77: if (this.eventSource) {
Línea 90: let displayType = data.type || data.messageType || 'Info';
```

**Código Corregido / Solución:**
```
// Refactorización Recomendada:
// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.
// Ejemplo:
// public void procesar() {
//   if (condicion) {
//     hacerSubProceso();
//   }
// }
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Clean Code / Principios de Mantenibilidad

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONT-SSE] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | front-sse/src/app/layout/component/app.menuitem.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/layout/component/app.menuitem.ts presenta una complejidad cognitiva estimada de 48, superando el umbral recomendado de 15.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).
- **Escenario de Riesgo:** Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.
- **Consecuencia:** Mayor probabilidad de introducir bugs en modificaciones futuras.

#### 1.3 ¿A quién afecta?
Equipo de Desarrollo / Pruebas QA

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/layout/component/app.menuitem.ts
Línea 12: @if (root() && isVisible()) {
Línea 15: @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 19: @if (hasChildren()) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/layout/component/app.menuitem.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/layout/component/app.menuitem.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 48
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Riesgo de bugs alto | 🟡 Media |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de calidad de código |
| **Reputación** | Tiempos de entrega lentos |
| **Usuarios Impactados** | Desarrolladores |
| **Costo Potencial** | Deuda técnica acumulada |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 3 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Refactorizar método**
- Ventaja: Mantenible
- Desventaja: Esfuerzo medio
- Esfuerzo: Medio

**Opción B: Extraer a submétodos puros** (Recomendada)
- Ventaja: Código limpio y testeable
- Desventaja: Requiere pruebas de regresión
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Extract Method Refactoring Pattern

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Línea 12: @if (root() && isVisible()) {
Línea 15: @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 19: @if (hasChildren()) {
```

**Código Corregido / Solución:**
```
// Refactorización Recomendada:
// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.
// Ejemplo:
// public void procesar() {
//   if (condicion) {
//     hacerSubProceso();
//   }
// }
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Clean Code / Principios de Mantenibilidad

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONT-SSE] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** front-sse  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | front-sse/src/app/layout/component/app.configurator.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/layout/component/app.configurator.ts presenta una complejidad cognitiva estimada de 35, superando el umbral recomendado de 15.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Demasiadas bifurcaciones lógicas anidadas (if, for, while, catch, &&, ||).
- **Escenario de Riesgo:** Dificultad severa para entender, mantener y realizar pruebas unitarias sobre el archivo.
- **Consecuencia:** Mayor probabilidad de introducir bugs en modificaciones futuras.

#### 1.3 ¿A quién afecta?
Equipo de Desarrollo / Pruebas QA

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: front-sse/src/app/layout/component/app.configurator.ts
Línea 19: declare type KeyOfType<T> = keyof T extends infer U ? U : never;
Línea 22: name?: string;
Línea 23: palette?: {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/layout/component/app.configurator.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/layout/component/app.configurator.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 35
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Riesgo de bugs alto | 🟡 Media |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Líneas de calidad de código |
| **Reputación** | Tiempos de entrega lentos |
| **Usuarios Impactados** | Desarrolladores |
| **Costo Potencial** | Deuda técnica acumulada |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 3 días |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Refactorizar método**
- Ventaja: Mantenible
- Desventaja: Esfuerzo medio
- Esfuerzo: Medio

**Opción B: Extraer a submétodos puros** (Recomendada)
- Ventaja: Código limpio y testeable
- Desventaja: Requiere pruebas de regresión
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Extract Method Refactoring Pattern

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Línea 19: declare type KeyOfType<T> = keyof T extends infer U ? U : never;
Línea 22: name?: string;
Línea 23: palette?: {
```

**Código Corregido / Solución:**
```
// Refactorización Recomendada:
// Extraer bloques lógicos complejos en funciones puras auxiliares e independientes.
// Ejemplo:
// public void procesar() {
//   if (condicion) {
//     hacerSubProceso();
//   }
// }
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
- [ ] Verificación en staging exitosa

---

### 7. 📚 Referencias & Contexto
- CWE-400: Uncontrolled Resource Consumption
- Clean Code / Principios de Mantenibilidad

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

