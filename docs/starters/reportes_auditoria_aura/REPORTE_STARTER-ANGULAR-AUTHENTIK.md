# Reporte de Hallazgos - Proyecto: STARTER-ANGULAR-AUTHENTIK

**Fecha:** 2026-07-09  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:511 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:511
this.rolService.listar().subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 511

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.rolService.listar().subscribe({
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
this.rolService.listar().subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:559 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:559
this.rolService.crear(request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 559

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.rolService.crear(request).subscribe({
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
this.rolService.crear(request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:582 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:582
this.rolService.actualizar(this.rolSeleccionado!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 582

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.rolService.actualizar(this.rolSeleccionado!.id, request).subscribe({
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
this.rolService.actualizar(this.rolSeleccionado!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:604 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:604
this.rolService.eliminar(rol.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 604

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.rolService.eliminar(rol.id).subscribe({
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
this.rolService.eliminar(rol.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:625 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:625
}).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 625

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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:667 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:667
.subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 667

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
.subscribe({
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
.subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:690 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:690
}).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 690

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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:732 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:732
.subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 732

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
.subscribe({
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
.subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:775 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:775
}).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 775

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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts:817 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/roles/roles.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts:817
.subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Observar la línea 817

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
.subscribe({
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
.subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/menus/menus.ts:423 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/menus/menus.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/menus/menus.ts:423
this.menuService.listar().subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/menus/menus.ts
2. Observar la línea 423

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.menuService.listar().subscribe({
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
this.menuService.listar().subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/menus/menus.ts:477 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/menus/menus.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/menus/menus.ts:477
this.menuService.crear(request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/menus/menus.ts
2. Observar la línea 477

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.menuService.crear(request).subscribe({
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
this.menuService.crear(request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/menus/menus.ts:504 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/menus/menus.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/menus/menus.ts:504
this.menuService.actualizar(this.menuSeleccionado!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/menus/menus.ts
2. Observar la línea 504

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.menuService.actualizar(this.menuSeleccionado!.id, request).subscribe({
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
this.menuService.actualizar(this.menuSeleccionado!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/menus/menus.ts:527 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/menus/menus.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/menus/menus.ts:527
this.menuService.eliminar(menu.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/menus/menus.ts
2. Observar la línea 527

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.menuService.eliminar(menu.id).subscribe({
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
this.menuService.eliminar(menu.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:349 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:349
this.catalogoService.listar(this.mostrarInactivosCatalogos).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 349

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.listar(this.mostrarInactivosCatalogos).subscribe({
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
this.catalogoService.listar(this.mostrarInactivosCatalogos).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:391 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:391
this.catalogoService.crear(request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 391

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.crear(request).subscribe({
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
this.catalogoService.crear(request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:410 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:410
this.catalogoService.actualizar(this.catalogoEnEdicion!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 410

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.actualizar(this.catalogoEnEdicion!.id, request).subscribe({
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
this.catalogoService.actualizar(this.catalogoEnEdicion!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:436 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:436
this.catalogoService.eliminar(catalogo.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 436

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.eliminar(catalogo.id).subscribe({
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
this.catalogoService.eliminar(catalogo.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:453 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:453
this.catalogoService.actualizar(catalogo.id, { activo: true }).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 453

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.actualizar(catalogo.id, { activo: true }).subscribe({
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
this.catalogoService.actualizar(catalogo.id, { activo: true }).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:489 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:489
this.catalogoService.listarItems(catalogoId, this.mostrarInactivosItems).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 489

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.listarItems(catalogoId, this.mostrarInactivosItems).subscribe({
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
this.catalogoService.listarItems(catalogoId, this.mostrarInactivosItems).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:529 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:529
this.catalogoService.crearItem(this.catalogoSeleccionado!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 529

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.crearItem(this.catalogoSeleccionado!.id, request).subscribe({
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
this.catalogoService.crearItem(this.catalogoSeleccionado!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:547 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:547
this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, this.itemEnEdicion!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 547

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, this.itemEnEdicion!.id, request).subscribe({
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
this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, this.itemEnEdicion!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:570 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:570
this.catalogoService.eliminarItem(this.catalogoSeleccionado!.id, item.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 570

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.eliminarItem(this.catalogoSeleccionado!.id, item.id).subscribe({
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
this.catalogoService.eliminarItem(this.catalogoSeleccionado!.id, item.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:584 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/catalogos/catalogos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts:584
this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, item.id, { activo: true }).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Observar la línea 584

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, item.id, { activo: true }).subscribe({
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
this.catalogoService.actualizarItem(this.catalogoSeleccionado!.id, item.id, { activo: true }).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts:330 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/recursos/recursos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts:330
this.recursoService.listar().subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Observar la línea 330

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.recursoService.listar().subscribe({
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
this.recursoService.listar().subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts:377 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/recursos/recursos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts:377
this.recursoService.crear(request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Observar la línea 377

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.recursoService.crear(request).subscribe({
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
this.recursoService.crear(request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts:400 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/recursos/recursos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts:400
this.recursoService.actualizar(this.recursoSeleccionado!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Observar la línea 400

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.recursoService.actualizar(this.recursoSeleccionado!.id, request).subscribe({
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
this.recursoService.actualizar(this.recursoSeleccionado!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts:422 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/recursos/recursos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts:422
this.recursoService.eliminar(recurso.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Observar la línea 422

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.recursoService.eliminar(recurso.id).subscribe({
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
this.recursoService.eliminar(recurso.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts:443 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/recursos/recursos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts:443
}).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Observar la línea 443

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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts:485 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/recursos/recursos.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts:485
.subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Observar la línea 485

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
.subscribe({
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
.subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:192 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/privilegios/privilegios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:192
this.privilegioService.listar().subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/privilegios/privilegios.ts
2. Observar la línea 192

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.privilegioService.listar().subscribe({
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
this.privilegioService.listar().subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:237 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/privilegios/privilegios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:237
this.privilegioService.crear(request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/privilegios/privilegios.ts
2. Observar la línea 237

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.privilegioService.crear(request).subscribe({
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
this.privilegioService.crear(request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:259 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/privilegios/privilegios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:259
this.privilegioService.actualizar(this.privilegioSeleccionado!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/privilegios/privilegios.ts
2. Observar la línea 259

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.privilegioService.actualizar(this.privilegioSeleccionado!.id, request).subscribe({
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
this.privilegioService.actualizar(this.privilegioSeleccionado!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:281 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/privilegios/privilegios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/privilegios/privilegios.ts:281
this.privilegioService.eliminar(privilegio.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/privilegios/privilegios.ts
2. Observar la línea 281

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.privilegioService.eliminar(privilegio.id).subscribe({
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
this.privilegioService.eliminar(privilegio.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:210 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/usuarios/usuarios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:210
this.usuarioService.listar().subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/usuarios/usuarios.ts
2. Observar la línea 210

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.usuarioService.listar().subscribe({
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
this.usuarioService.listar().subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:262 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/usuarios/usuarios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:262
this.usuarioService.crear(request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/usuarios/usuarios.ts
2. Observar la línea 262

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.usuarioService.crear(request).subscribe({
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
this.usuarioService.crear(request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:285 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/usuarios/usuarios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:285
this.usuarioService.actualizar(this.usuarioSeleccionado!.id, request).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/usuarios/usuarios.ts
2. Observar la línea 285

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.usuarioService.actualizar(this.usuarioSeleccionado!.id, request).subscribe({
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
this.usuarioService.actualizar(this.usuarioSeleccionado!.id, request).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:308 |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Buenas prácticas de Angular |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó un .subscribe() sin mecanismo de liberación en src/app/pages/usuarios/usuarios.ts.

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
// Ubicación: starter-angular-authentik/src/app/pages/usuarios/usuarios.ts:308
this.usuarioService.eliminar(usuario.id).subscribe({
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/usuarios/usuarios.ts
2. Observar la línea 308

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn '.subscribe('
```

#### 2.4 Output/Respuesta Observada
```
this.usuarioService.eliminar(usuario.id).subscribe({
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
this.usuarioService.eliminar(usuario.id).subscribe({
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

## [PERF-LEAK-STARTER-ANGULAR-AUTHENTIK] Fuga de Memoria potencial por Suscripciones Huérfanas en Angular

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-angular-authentik/src/app/layout/component/app.menuitem.ts:145 |
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
// Ubicación: starter-angular-authentik/src/app/layout/component/app.menuitem.ts:145
this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/layout/component/app.menuitem.ts
2. Observar la línea 145

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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/core/services/usuario-contexto.service.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/core/services/usuario-contexto.service.ts presenta una complejidad cognitiva estimada de 75, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/core/services/usuario-contexto.service.ts
Línea 13: descripcion?: string;
Línea 21: route?: string | null;
Línea 22: icon?: string | null;
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/core/services/usuario-contexto.service.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/core/services/usuario-contexto.service.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 75
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
Línea 13: descripcion?: string;
Línea 21: route?: string | null;
Línea 22: icon?: string | null;
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/crud/crud.ts |
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
// Ubicación: starter-angular-authentik/src/app/pages/crud/crud.ts
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/roles/roles.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/roles/roles.ts presenta una complejidad cognitiva estimada de 66, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/roles/roles.ts
Línea 160: <td>{{ rol.descripcion || '-' }}</td>
Línea 162: <p-tag [value]="rol.activo ? 'Activo' : 'Inactivo'" [severity]="rol.activo ? 'success' : 'danger'" />
Línea 171: [loading]="guardandoAsignacion() && rolSeleccionadoParaAsignacion()?.id === rol.id"
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/roles/roles.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/roles/roles.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 66
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
Línea 160: <td>{{ rol.descripcion || '-' }}</td>
Línea 162: <p-tag [value]="rol.activo ? 'Activo' : 'Inactivo'" [severity]="rol.activo ? 'success' : 'danger'" />
Línea 171: [loading]="guardandoAsignacion() && rolSeleccionadoParaAsignacion()?.id === rol.id"
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/menus/menus.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/menus/menus.ts presenta una complejidad cognitiva estimada de 49, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/menus/menus.ts
Línea 153: <td>{{ menu.route || '-' }}</td>
Línea 155: @if (menu.icon) {
Línea 164: <td>{{ menu.peso ?? '-' }}</td>
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/menus/menus.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/menus/menus.ts | grep -E 'if|for|while|catch'
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
Línea 153: <td>{{ menu.route || '-' }}</td>
Línea 155: @if (menu.icon) {
Línea 164: <td>{{ menu.peso ?? '-' }}</td>
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/uikit/tabledemo.ts |
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
// Ubicación: starter-angular-authentik/src/app/pages/uikit/tabledemo.ts
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/catalogos/catalogos.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/catalogos/catalogos.ts presenta una complejidad cognitiva estimada de 50, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/catalogos/catalogos.ts
Línea 124: <p-tag [value]="catalogo.activo ? 'Activo' : 'Inactivo'" [severity]="catalogo.activo ? 'success' : 'danger'" />
Línea 128: @if (catalogo.activo) {
Línea 146: @if (catalogoSeleccionado) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/catalogos/catalogos.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/catalogos/catalogos.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 50
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
Línea 124: <p-tag [value]="catalogo.activo ? 'Activo' : 'Inactivo'" [severity]="catalogo.activo ? 'success' : 'danger'" />
Línea 128: @if (catalogo.activo) {
Línea 146: @if (catalogoSeleccionado) {
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/recursos/recursos.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/recursos/recursos.ts presenta una complejidad cognitiva estimada de 44, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/recursos/recursos.ts
Línea 122: <td>{{ recurso.descripcion || '-' }}</td>
Línea 124: <p-tag [value]="recurso.activo ? 'Activo' : 'Inactivo'" [severity]="recurso.activo ? 'success' : 'danger'" />
Línea 135: [loading]="guardandoPrivilegios() && recursoSeleccionadoParaPrivilegios()?.id === recurso.id"
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/recursos/recursos.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/recursos/recursos.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 44
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
Línea 122: <td>{{ recurso.descripcion || '-' }}</td>
Línea 124: <p-tag [value]="recurso.activo ? 'Activo' : 'Inactivo'" [severity]="recurso.activo ? 'success' : 'danger'" />
Línea 135: [loading]="guardandoPrivilegios() && recursoSeleccionadoParaPrivilegios()?.id === recurso.id"
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/privilegios/privilegios.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/privilegios/privilegios.ts presenta una complejidad cognitiva estimada de 22, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/privilegios/privilegios.ts
Línea 92: <td>{{ privilegio.descripcion || '-' }}</td>
Línea 94: <p-tag [value]="privilegio.activo ? 'Activo' : 'Inactivo'" [severity]="privilegio.activo ? 'success' : 'danger'" />
Línea 113: [header]="esNuevo ? 'Nuevo Privilegio' : 'Editar Privilegio'"
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/privilegios/privilegios.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/privilegios/privilegios.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 22
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
Línea 92: <td>{{ privilegio.descripcion || '-' }}</td>
Línea 94: <p-tag [value]="privilegio.activo ? 'Activo' : 'Inactivo'" [severity]="privilegio.activo ? 'success' : 'danger'" />
Línea 113: [header]="esNuevo ? 'Nuevo Privilegio' : 'Editar Privilegio'"
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/usuarios/usuarios.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/usuarios/usuarios.ts presenta una complejidad cognitiva estimada de 43, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/usuarios/usuarios.ts
Línea 101: <p-tag [value]="usuario.activo ? 'Activo' : 'Inactivo'" [severity]="usuario.activo ? 'success' : 'danger'" />
Línea 122: [header]="esNuevo ? 'Nuevo Usuario' : 'Editar Usuario'"
Línea 128: <label for="username" class="block font-bold mb-2">Username @if (esNuevo) { <span class="text-red-500">*</span> }</label>
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/usuarios/usuarios.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/usuarios/usuarios.ts | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 43
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
Línea 101: <p-tag [value]="usuario.activo ? 'Activo' : 'Inactivo'" [severity]="usuario.activo ? 'success' : 'danger'" />
Línea 122: [header]="esNuevo ? 'Nuevo Usuario' : 'Editar Usuario'"
Línea 128: <label for="username" class="block font-bold mb-2">Username @if (esNuevo) { <span class="text-red-500">*</span> }</label>
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/service/product.service.ts |
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
// Ubicación: starter-angular-authentik/src/app/pages/service/product.service.ts
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/pages/service/menu.service.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/pages/service/menu.service.ts presenta una complejidad cognitiva estimada de 17, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/pages/service/menu.service.ts
Línea 11: route?: string | null;
Línea 12: icon?: string | null;
Línea 13: parentId?: number | null;
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/pages/service/menu.service.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/pages/service/menu.service.ts | grep -E 'if|for|while|catch'
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
Línea 11: route?: string | null;
Línea 12: icon?: string | null;
Línea 13: parentId?: number | null;
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/components/base-sistema/system-menuitem.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/components/base-sistema/system-menuitem.component.ts presenta una complejidad cognitiva estimada de 37, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/components/base-sistema/system-menuitem.component.ts
Línea 12: @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 16: [ngClass]="[(item().class || ''), esInicio() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold border border-primary-200 dark:border-primary-700' : '']"
Línea 24: @if (hasChildren()) {
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
Puntuación de complejidad estimada: 37
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
Línea 12: @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 16: [ngClass]="[(item().class || ''), esInicio() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold border border-primary-200 dark:border-primary-700' : '']"
Línea 24: @if (hasChildren()) {
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/components/base-sistema/system-topbar.component.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/components/base-sistema/system-topbar.component.ts presenta una complejidad cognitiva estimada de 21, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/components/base-sistema/system-topbar.component.ts
Línea 27: @if (rolesDisponibles().length) {
Línea 29: <label for="selectorRol" class="sr-only">Rol activo</label>
Línea 37: @for (rol of rolesDisponibles(); track rol.id) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/app/components/base-sistema/system-topbar.component.ts
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/app/components/base-sistema/system-topbar.component.ts | grep -E 'if|for|while|catch'
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
Línea 27: @if (rolesDisponibles().length) {
Línea 29: <label for="selectorRol" class="sr-only">Rol activo</label>
Línea 37: @for (rol of rolesDisponibles(); track rol.id) {
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/layout/component/app.menuitem.ts |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/app/layout/component/app.menuitem.ts presenta una complejidad cognitiva estimada de 59, superando el umbral recomendado de 15.

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
// Ubicación: starter-angular-authentik/src/app/layout/component/app.menuitem.ts
Línea 12: @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 16: [ngClass]="[(item().class || ''), esInicio() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold border border-primary-200 dark:border-primary-700 rounded-lg' : '']"
Línea 23: @if (hasChildren()) {
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
Puntuación de complejidad estimada: 59
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
Línea 12: @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
Línea 16: [ngClass]="[(item().class || ''), esInicio() ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-semibold border border-primary-200 dark:border-primary-700 rounded-lg' : '']"
Línea 23: @if (hasChildren()) {
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

## [PERF-CMP-STARTER-ANGULAR-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-angular-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-angular-authentik/src/app/layout/component/app.configurator.ts |
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
// Ubicación: starter-angular-authentik/src/app/layout/component/app.configurator.ts
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

