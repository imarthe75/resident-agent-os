# Reporte de Hallazgos - Proyecto: FRONTEND-HOMOLOGADO

**Fecha:** 2026-07-09  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-HEADERS-FRONTEND-HOMOLOGADO] Ausencia de Cabeceras de Seguridad Críticas en Nginx

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Seguridad |
| **Componente Afectado** | frontend-homologado/nginx.conf |
| **CVE/CWE** | CWE-693: Protection Mechanism Failure |
| **Normativa Aplicable** | OWASP A05 / CIS Benchmarks |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Faltan cabeceras fundamentales en nginx.conf: Content-Security-Policy, Strict-Transport-Security, Referrer-Policy.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Directivas add_header ausentes en la configuración.
- **Escenario de Riesgo:** Ataques XSS o MITM por falta de HSTS/CSP.
- **Consecuencia:** Suplantación de identidad o robo de cookies.

#### 1.3 ¿A quién afecta?
Servidor Nginx

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: frontend-homologado/nginx.conf
nginx.conf sin cabeceras: Content-Security-Policy, Strict-Transport-Security, Referrer-Policy
```

#### 2.2 Pasos para Reproducir
1. Inspeccionar nginx.conf
2. Validar bloque server

#### 2.3 Comando Exacto para Verificar
```bash
grep 'add_header' nginx.conf
```

#### 2.4 Output/Respuesta Observada
```
Cabeceras incompletas
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Media | 🟠 Alta |
| **Integridad** | Inyección XSS | 🟠 Alta |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | OWASP A05 |
| **Reputación** | Afectada |
| **Usuarios Impactados** | Usuarios finales |
| **Costo Potencial** | Bajo |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 hora |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: CDN**
- Ventaja: Fácil
- Desventaja: Dependencia
- Esfuerzo: Bajo

**Opción B: add_header en Nginx** (Recomendada)
- Ventaja: Portátil
- Desventaja: Requiere redeploy
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- add_header Content-Security-Policy ...

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
nginx.conf sin cabeceras: Content-Security-Policy, Strict-Transport-Security, Referrer-Policy
```

**Código Corregido / Solución:**
```
# Agregar cabeceras de seguridad recomendadas en el bloque server {
add_header Content-Security-Policy "default-src 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
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
- CWE-693: Protection Mechanism Failure
- OWASP A05 / CIS Benchmarks

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/consulta/consulta.ts:58 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/consulta/consulta.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/consulta/consulta.ts:58
this.citasService.consultarCita({ folioSolicitud: folio!, correo: correo! }).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/consulta/consulta.ts
2. Observar la línea 58

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.citasService.consultarCita({ folioSolicitud: folio!, correo: correo! }).subscribe({
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
this.citasService.consultarCita({ folioSolicitud: folio!, correo: correo! }).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/menu/menu.ts:37 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/menu/menu.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/menu/menu.ts:37
this.route.queryParamMap.subscribe(params => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/menu/menu.ts
2. Observar la línea 37

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.route.queryParamMap.subscribe(params => {
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
this.route.queryParamMap.subscribe(params => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/agendar/agendar.ts:56 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/agendar/agendar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/agendar/agendar.ts:56
this.route.queryParamMap.subscribe(params => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/agendar/agendar.ts
2. Observar la línea 56

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.route.queryParamMap.subscribe(params => {
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
this.route.queryParamMap.subscribe(params => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/agendar/agendar.ts:72 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/agendar/agendar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/agendar/agendar.ts:72
this.citasService.validarToken(token).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/agendar/agendar.ts
2. Observar la línea 72

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.citasService.validarToken(token).subscribe({
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
this.citasService.validarToken(token).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/agendar/agendar.ts:92 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/agendar/agendar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/agendar/agendar.ts:92
this.citasService.getAvailability(formattedDate).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/agendar/agendar.ts
2. Observar la línea 92

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.citasService.getAvailability(formattedDate).subscribe({
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
this.citasService.getAvailability(formattedDate).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/agendar/agendar.ts:128 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/agendar/agendar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/agendar/agendar.ts:128
this.citasService.agendar(payload).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/agendar/agendar.ts
2. Observar la línea 128

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.citasService.agendar(payload).subscribe({
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
this.citasService.agendar(payload).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/agendar/agendar.ts:145 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/agendar/agendar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/agendar/agendar.ts:145
this.citasService.getDisponibilidadMensual(year, month).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/agendar/agendar.ts
2. Observar la línea 145

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.citasService.getDisponibilidadMensual(year, month).subscribe({
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
this.citasService.getDisponibilidadMensual(year, month).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts:35 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts:35
this.route.queryParamMap.subscribe(params => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts
2. Observar la línea 35

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.route.queryParamMap.subscribe(params => {
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
this.route.queryParamMap.subscribe(params => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts:53 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts:53
this.citasService.confirmarCancelacion(token).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/confirmar-cancelacion/confirmar-cancelacion.ts
2. Observar la línea 53

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.citasService.confirmarCancelacion(token).subscribe({
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
this.citasService.confirmarCancelacion(token).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/cancelar/cancelar.ts:42 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/cancelar/cancelar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/cancelar/cancelar.ts:42
this.route.queryParamMap.subscribe(params => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/cancelar/cancelar.ts
2. Observar la línea 42

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.route.queryParamMap.subscribe(params => {
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
this.route.queryParamMap.subscribe(params => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/cancelar/cancelar.ts:64 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/citas/cancelar/cancelar.ts.

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
// Ubicación: frontend-homologado/src/app/components/citas/cancelar/cancelar.ts:64
}).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/cancelar/cancelar.ts
2. Observar la línea 64

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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts:113 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts:113
}).subscribe(() => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts
2. Observar la línea 113

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
}).subscribe(() => {
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
}).subscribe(() => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts:121 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts:121
}).subscribe(() => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts
2. Observar la línea 121

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
}).subscribe(() => {
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
}).subscribe(() => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts:160 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts:160
this.adminService.eliminarDiaInhabil(id).subscribe(() => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dias-inhabiles-globales/dias-inhabiles-globales.component.ts
2. Observar la línea 160

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.eliminarDiaInhabil(id).subscribe(() => {
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
this.adminService.eliminarDiaInhabil(id).subscribe(() => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:158 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/configuracion-form/configuracion-form.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:158
this.configForm.get('fechaDesde')?.valueChanges.subscribe(value => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/configuracion-form/configuracion-form.component.ts
2. Observar la línea 158

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.configForm.get('fechaDesde')?.valueChanges.subscribe(value => {
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
this.configForm.get('fechaDesde')?.valueChanges.subscribe(value => {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:184 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/configuracion-form/configuracion-form.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:184
this.adminService.getConfiguracionById(id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/configuracion-form/configuracion-form.component.ts
2. Observar la línea 184

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.getConfiguracionById(id).subscribe({
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
this.adminService.getConfiguracionById(id).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:227 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/configuracion-form/configuracion-form.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:227
this.adminService.actualizarConfiguracion(this.configId!, datos).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/configuracion-form/configuracion-form.component.ts
2. Observar la línea 227

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.actualizarConfiguracion(this.configId!, datos).subscribe({
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
this.adminService.actualizarConfiguracion(this.configId!, datos).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:231 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/configuracion-form/configuracion-form.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts:231
this.adminService.crearConfiguracion(datos).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/configuracion-form/configuracion-form.component.ts
2. Observar la línea 231

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.crearConfiguracion(datos).subscribe({
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
this.adminService.crearConfiguracion(datos).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts:73 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts:73
this.adminService.crearDiaInhabilRango(datos).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts
2. Observar la línea 73

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.crearDiaInhabilRango(datos).subscribe({
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
this.adminService.crearDiaInhabilRango(datos).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts:89 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts:89
this.adminService.crearDiaInhabil(nuevo).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts
2. Observar la línea 89

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.crearDiaInhabil(nuevo).subscribe({
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
this.adminService.crearDiaInhabil(nuevo).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts:116 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts:116
this.adminService.eliminarDiaInhabil(id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dias-inhabiles/dias-inhabiles.component.ts
2. Observar la línea 116

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.eliminarDiaInhabil(id).subscribe({
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
this.adminService.eliminarDiaInhabil(id).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/configuracion-lista/configuracion-lista.component.ts:72 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components/admin/configuracion-lista/configuracion-lista.component.ts.

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
// Ubicación: frontend-homologado/src/app/components/admin/configuracion-lista/configuracion-lista.component.ts:72
this.adminService.eliminarConfiguracion(id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/configuracion-lista/configuracion-lista.component.ts
2. Observar la línea 72

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.adminService.eliminarConfiguracion(id).subscribe({
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
this.adminService.eliminarConfiguracion(id).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/layout/component/app.menuitem.ts:133 |
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
// Ubicación: frontend-homologado/src/app/layout/component/app.menuitem.ts:133
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-LEAK-FRONTEND-HOMOLOGADO] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | frontend-homologado/src/app/components-publics/auth/login/login.component.ts:60 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/components-publics/auth/login/login.component.ts.

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
// Ubicación: frontend-homologado/src/app/components-publics/auth/login/login.component.ts:60
this.authService.login(this.loginData).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components-publics/auth/login/login.component.ts
2. Observar la línea 60

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.authService.login(this.loginData).subscribe({
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
this.authService.login(this.loginData).subscribe({
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/core/interceptors/global-response.interceptor.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/core/interceptors/global-response.interceptor.ts presenta una complejidad cognitiva estimada de 21, superando el umbral recomendado de 15.

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
// Ubicación: frontend-homologado/src/app/core/interceptors/global-response.interceptor.ts
Línea 12: if (req.url.includes('/assets/')) {
Línea 18: if (event instanceof HttpResponse) {
Línea 21: if (body && typeof body === 'object' && 'responseCode' in body) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/core/interceptors/global-response.interceptor.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/core/interceptors/global-response.interceptor.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 21
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
Línea 12: if (req.url.includes('/assets/')) {
Línea 18: if (event instanceof HttpResponse) {
Línea 21: if (body && typeof body === 'object' && 'responseCode' in body) {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/pages/crud/crud.ts |
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
// Ubicación: frontend-homologado/src/app/pages/crud/crud.ts
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/pages/uikit/tabledemo.ts |
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
// Ubicación: frontend-homologado/src/app/pages/uikit/tabledemo.ts
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/pages/service/product.service.ts |
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
// Ubicación: frontend-homologado/src/app/pages/service/product.service.ts
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/components/citas/agendar/agendar.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/components/citas/agendar/agendar.ts presenta una complejidad cognitiva estimada de 19, superando el umbral recomendado de 15.

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
// Ubicación: frontend-homologado/src/app/components/citas/agendar/agendar.ts
Línea 58: if (token) {
Línea 94: this.timeSlots.set(slots || []);
Línea 95: const availableCount = (slots || []).filter(s => s.disponible).length;
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/citas/agendar/agendar.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/components/citas/agendar/agendar.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 19
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
Línea 58: if (token) {
Línea 94: this.timeSlots.set(slots || []);
Línea 95: const availableCount = (slots || []).filter(s => s.disponible).length;
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/dashboard/dashboard.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/components/admin/dashboard/dashboard.component.ts presenta una complejidad cognitiva estimada de 17, superando el umbral recomendado de 15.

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
// Ubicación: frontend-homologado/src/app/components/admin/dashboard/dashboard.component.ts
Línea 123: totalHoy: this.appointments().filter(c => c.servicioId === servicio.id && c.fecha === today).length
Línea 138: if (this.servicioExpandido() === servicioId) {
Línea 150: let citasFiltradas = this.appointments().filter(c => c.fecha === today && c.servicioId === servicioId);
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/dashboard/dashboard.component.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/components/admin/dashboard/dashboard.component.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 17
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
Línea 123: totalHoy: this.appointments().filter(c => c.servicioId === servicio.id && c.fecha === today).length
Línea 138: if (this.servicioExpandido() === servicioId) {
Línea 150: let citasFiltradas = this.appointments().filter(c => c.fecha === today && c.servicioId === servicioId);
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/components/admin/configuracion-form/configuracion-form.component.ts presenta una complejidad cognitiva estimada de 49, superando el umbral recomendado de 15.

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
// Ubicación: frontend-homologado/src/app/components/admin/configuracion-form/configuracion-form.component.ts
Línea 33: const start = control.get('horaInicio')?.value;
Línea 34: const end = control.get('horaFin')?.value;
Línea 36: if (start && end) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/admin/configuracion-form/configuracion-form.component.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/components/admin/configuracion-form/configuracion-form.component.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 49
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
Línea 33: const start = control.get('horaInicio')?.value;
Línea 34: const end = control.get('horaFin')?.value;
Línea 36: if (start && end) {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/components/base-sistema/system-menuitem.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/components/base-sistema/system-menuitem.component.ts presenta una complejidad cognitiva estimada de 28, superando el umbral recomendado de 15.

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
// Ubicación: frontend-homologado/src/app/components/base-sistema/system-menuitem.component.ts
Línea 12: @if (root() && isVisible()) {
Línea 15: <!-- @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 19: @if (hasChildren()) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/base-sistema/system-menuitem.component.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/components/base-sistema/system-menuitem.component.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 28
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
Línea 15: <!-- @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/layout/component/app.menuitem.ts |
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
// Ubicación: frontend-homologado/src/app/layout/component/app.menuitem.ts
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-FRONTEND-HOMOLOGADO] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** frontend-homologado  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | frontend-homologado/src/app/layout/component/app.configurator.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/layout/component/app.configurator.ts presenta una complejidad cognitiva estimada de 41, superando el umbral recomendado de 15.

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
// Ubicación: frontend-homologado/src/app/layout/component/app.configurator.ts
Línea 29: declare type KeyOfType<T> = keyof T extends infer U ? U : never;
Línea 32: name?: string;
Línea 33: palette?: {
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
Puntuación de complejidad estimada: 41
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
Línea 29: declare type KeyOfType<T> = keyof T extends infer U ? U : never;
Línea 32: name?: string;
Línea 33: palette?: {
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

