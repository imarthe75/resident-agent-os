# Reporte de Hallazgos - Proyecto: BACKEND-AGENDADOR

**Fecha:** 2026-07-13  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/resources/application.properties:21 |
| **CVE/CWE** | CWE-798: Use of Hard-coded Credentials |
| **Normativa Aplicable** | ISO27001 A.10 / OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una credencial expuesta directamente en texto plano en el archivo src/main/resources/application.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de secretos en archivo de texto plano.
- **Escenario de Riesgo:** Un atacante con acceso al código fuente podría comprometer la BD o servicios.
- **Consecuencia:** Acceso total no autorizado a los datos.

#### 1.3 ¿A quién afecta?
Base de datos / Infraestructura

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application.properties:21
application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application.properties
2. Observar línea 21

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application.properties | grep -n 'application.security.jwt.secret-key'
```

#### 2.4 Output/Respuesta Observada
```
application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Exposición de credenciales | 🔴 Crítica |
| **Integridad** | Total | 🔴 Crítica |
| **Disponibilidad** | Alta | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Incumplimiento normativo |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios |
| **Costo Potencial** | Multas potenciales |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (<2h) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables directas**
- Ventaja: Rápido
- Desventaja: Difícil gestionar
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos Vault** (Recomendada)
- Ventaja: Seguro
- Desventaja: Configuración
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Inyección por variables de entorno seguras

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
application.security.jwt.secret-key = ${APPLICATION.SECURITY.JWT.SECRET-KEY_ENV}
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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/resources/application-local.properties:6 |
| **CVE/CWE** | CWE-798: Use of Hard-coded Credentials |
| **Normativa Aplicable** | ISO27001 A.10 / OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una credencial expuesta directamente en texto plano en el archivo src/main/resources/application-local.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de secretos en archivo de texto plano.
- **Escenario de Riesgo:** Un atacante con acceso al código fuente podría comprometer la BD o servicios.
- **Consecuencia:** Acceso total no autorizado a los datos.

#### 1.3 ¿A quién afecta?
Base de datos / Infraestructura

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application-local.properties:6
spring.datasource.password=p6GouQ#VR298Ps9gLrkq
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-local.properties
2. Observar línea 6

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-local.properties | grep -n 'spring.datasource.password'
```

#### 2.4 Output/Respuesta Observada
```
spring.datasource.password=p6GouQ#VR298Ps9gLrkq
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Exposición de credenciales | 🔴 Crítica |
| **Integridad** | Total | 🔴 Crítica |
| **Disponibilidad** | Alta | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Incumplimiento normativo |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios |
| **Costo Potencial** | Multas potenciales |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (<2h) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables directas**
- Ventaja: Rápido
- Desventaja: Difícil gestionar
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos Vault** (Recomendada)
- Ventaja: Seguro
- Desventaja: Configuración
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Inyección por variables de entorno seguras

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
spring.datasource.password=p6GouQ#VR298Ps9gLrkq
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
spring.datasource.password = ${SPRING.DATASOURCE.PASSWORD_ENV}
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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/resources/application-local.properties:11 |
| **CVE/CWE** | CWE-798: Use of Hard-coded Credentials |
| **Normativa Aplicable** | ISO27001 A.10 / OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una credencial expuesta directamente en texto plano en el archivo src/main/resources/application-local.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de secretos en archivo de texto plano.
- **Escenario de Riesgo:** Un atacante con acceso al código fuente podría comprometer la BD o servicios.
- **Consecuencia:** Acceso total no autorizado a los datos.

#### 1.3 ¿A quién afecta?
Base de datos / Infraestructura

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application-local.properties:11
#spring.datasource.password=p6GouQ#VR298Ps9gLrkq
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-local.properties
2. Observar línea 11

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-local.properties | grep -n '#spring.datasource.password'
```

#### 2.4 Output/Respuesta Observada
```
#spring.datasource.password=p6GouQ#VR298Ps9gLrkq
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Exposición de credenciales | 🔴 Crítica |
| **Integridad** | Total | 🔴 Crítica |
| **Disponibilidad** | Alta | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Incumplimiento normativo |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios |
| **Costo Potencial** | Multas potenciales |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (<2h) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables directas**
- Ventaja: Rápido
- Desventaja: Difícil gestionar
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos Vault** (Recomendada)
- Ventaja: Seguro
- Desventaja: Configuración
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Inyección por variables de entorno seguras

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
#spring.datasource.password=p6GouQ#VR298Ps9gLrkq
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
#spring.datasource.password = ${#SPRING.DATASOURCE.PASSWORD_ENV}
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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/resources/application-dev.properties:6 |
| **CVE/CWE** | CWE-798: Use of Hard-coded Credentials |
| **Normativa Aplicable** | ISO27001 A.10 / OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una credencial expuesta directamente en texto plano en el archivo src/main/resources/application-dev.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de secretos en archivo de texto plano.
- **Escenario de Riesgo:** Un atacante con acceso al código fuente podría comprometer la BD o servicios.
- **Consecuencia:** Acceso total no autorizado a los datos.

#### 1.3 ¿A quién afecta?
Base de datos / Infraestructura

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application-dev.properties:6
spring.datasource.password=sicapem_user
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-dev.properties
2. Observar línea 6

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-dev.properties | grep -n 'spring.datasource.password'
```

#### 2.4 Output/Respuesta Observada
```
spring.datasource.password=sicapem_user
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Exposición de credenciales | 🔴 Crítica |
| **Integridad** | Total | 🔴 Crítica |
| **Disponibilidad** | Alta | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Incumplimiento normativo |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios |
| **Costo Potencial** | Multas potenciales |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (<2h) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables directas**
- Ventaja: Rápido
- Desventaja: Difícil gestionar
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos Vault** (Recomendada)
- Ventaja: Seguro
- Desventaja: Configuración
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Inyección por variables de entorno seguras

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
spring.datasource.password=sicapem_user
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
spring.datasource.password = ${SPRING.DATASOURCE.PASSWORD_ENV}
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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/resources/application-prod.properties:7 |
| **CVE/CWE** | CWE-798: Use of Hard-coded Credentials |
| **Normativa Aplicable** | ISO27001 A.10 / OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una credencial expuesta directamente en texto plano en el archivo src/main/resources/application-prod.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de secretos en archivo de texto plano.
- **Escenario de Riesgo:** Un atacante con acceso al código fuente podría comprometer la BD o servicios.
- **Consecuencia:** Acceso total no autorizado a los datos.

#### 1.3 ¿A quién afecta?
Base de datos / Infraestructura

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application-prod.properties:7
spring.datasource.password=rfrjA7UD8bZ$
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-prod.properties
2. Observar línea 7

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-prod.properties | grep -n 'spring.datasource.password'
```

#### 2.4 Output/Respuesta Observada
```
spring.datasource.password=rfrjA7UD8bZ$
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | Exposición de credenciales | 🔴 Crítica |
| **Integridad** | Total | 🔴 Crítica |
| **Disponibilidad** | Alta | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Incumplimiento normativo |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios |
| **Costo Potencial** | Multas potenciales |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (<2h) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables directas**
- Ventaja: Rápido
- Desventaja: Difícil gestionar
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos Vault** (Recomendada)
- Ventaja: Seguro
- Desventaja: Configuración
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- Inyección por variables de entorno seguras

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
spring.datasource.password=rfrjA7UD8bZ$
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
spring.datasource.password = ${SPRING.DATASOURCE.PASSWORD_ENV}
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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-CORS-BACKEND-AGENDADOR] Configuración Permisiva de CORS (Wildcard '*')

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/java/citas/agenda/web/config/SecurityConfig.java:29 |
| **CVE/CWE** | CWE-942: Overly Permissive CORS |
| **Normativa Aplicable** | OWASP A05 |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó el uso de comodín '*' en los orígenes permitidos de CORS en src/main/java/citas/agenda/web/config/SecurityConfig.java.

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
// Ubicación: backend-agendador/src/main/java/citas/agenda/web/config/SecurityConfig.java:29
@Value("${cors.allowed.origins:*}")
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/citas/agenda/web/config/SecurityConfig.java
2. Observar la línea 29

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/citas/agenda/web/config/SecurityConfig.java | grep -n '*'
```

#### 2.4 Output/Respuesta Observada
```
@Value("${cors.allowed.origins:*}")
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
@Value("${cors.allowed.origins:*}")
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

## [PERF-IDX-BACKEND-AGENDADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:22 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/002-agenda-citas-tables.sql que carece de índice asociado.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Declaración de FOREIGN KEY sin INDEX complementario.
- **Escenario de Riesgo:** Escaneos secuenciales lentos durante JOINs masivos.
- **Consecuencia:** Retardos de respuesta en el API.

#### 1.3 ¿A quién afecta?
Base de datos relacional

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:22
sede_id UUID NOT NULL,
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/002-agenda-citas-tables.sql
2. Buscar la declaración de FOREIGN KEY en 22

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/002-agenda-citas-tables.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
sede_id UUID NOT NULL,
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Baja | 🟡 Media |
| **Performance** | Lenta | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Estándares de diseño de persistencia |
| **Reputación** | Baja velocidad de la plataforma |
| **Usuarios Impactados** | Usuarios recurrentes |
| **Costo Potencial** | Mayor consumo CPU |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Manual**
- Ventaja: Inmediato
- Desventaja: Difícil mantener
- Esfuerzo: Bajo

**Opción B: Índice en script de migración** (Recomendada)
- Ventaja: Consistente
- Desventaja: Requiere pruebas de lock
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- CREATE INDEX idx_tabla_fk ON tabla(columna_id)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
sede_id UUID NOT NULL,
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-agendador_fk ON tabla_afectada(columna_id);
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
- CWE-707: Improper Enforcement of Message or Data Structure
- Mejores prácticas de Base de Datos

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-IDX-BACKEND-AGENDADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:27 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/002-agenda-citas-tables.sql que carece de índice asociado.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Declaración de FOREIGN KEY sin INDEX complementario.
- **Escenario de Riesgo:** Escaneos secuenciales lentos durante JOINs masivos.
- **Consecuencia:** Retardos de respuesta en el API.

#### 1.3 ¿A quién afecta?
Base de datos relacional

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:27
CONSTRAINT uk_servicio_sede UNIQUE (servicio_id, sede_id),
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/002-agenda-citas-tables.sql
2. Buscar la declaración de FOREIGN KEY en 27

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/002-agenda-citas-tables.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
CONSTRAINT uk_servicio_sede UNIQUE (servicio_id, sede_id),
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Baja | 🟡 Media |
| **Performance** | Lenta | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Estándares de diseño de persistencia |
| **Reputación** | Baja velocidad de la plataforma |
| **Usuarios Impactados** | Usuarios recurrentes |
| **Costo Potencial** | Mayor consumo CPU |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Manual**
- Ventaja: Inmediato
- Desventaja: Difícil mantener
- Esfuerzo: Bajo

**Opción B: Índice en script de migración** (Recomendada)
- Ventaja: Consistente
- Desventaja: Requiere pruebas de lock
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- CREATE INDEX idx_tabla_fk ON tabla(columna_id)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
CONSTRAINT uk_servicio_sede UNIQUE (servicio_id, sede_id),
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-agendador_fk ON tabla_afectada(columna_id);
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
- CWE-707: Improper Enforcement of Message or Data Structure
- Mejores prácticas de Base de Datos

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-IDX-BACKEND-AGENDADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:28 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/002-agenda-citas-tables.sql que carece de índice asociado.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Declaración de FOREIGN KEY sin INDEX complementario.
- **Escenario de Riesgo:** Escaneos secuenciales lentos durante JOINs masivos.
- **Consecuencia:** Retardos de respuesta en el API.

#### 1.3 ¿A quién afecta?
Base de datos relacional

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:28
CONSTRAINT fk_servicio_sede_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/002-agenda-citas-tables.sql
2. Buscar la declaración de FOREIGN KEY en 28

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/002-agenda-citas-tables.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
CONSTRAINT fk_servicio_sede_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Baja | 🟡 Media |
| **Performance** | Lenta | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Estándares de diseño de persistencia |
| **Reputación** | Baja velocidad de la plataforma |
| **Usuarios Impactados** | Usuarios recurrentes |
| **Costo Potencial** | Mayor consumo CPU |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Manual**
- Ventaja: Inmediato
- Desventaja: Difícil mantener
- Esfuerzo: Bajo

**Opción B: Índice en script de migración** (Recomendada)
- Ventaja: Consistente
- Desventaja: Requiere pruebas de lock
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- CREATE INDEX idx_tabla_fk ON tabla(columna_id)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
CONSTRAINT fk_servicio_sede_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-agendador_fk ON tabla_afectada(columna_id);
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
- CWE-707: Improper Enforcement of Message or Data Structure
- Mejores prácticas de Base de Datos

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-IDX-BACKEND-AGENDADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:29 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/002-agenda-citas-tables.sql que carece de índice asociado.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Declaración de FOREIGN KEY sin INDEX complementario.
- **Escenario de Riesgo:** Escaneos secuenciales lentos durante JOINs masivos.
- **Consecuencia:** Retardos de respuesta en el API.

#### 1.3 ¿A quién afecta?
Base de datos relacional

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:29
CONSTRAINT fk_servicio_sede_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/002-agenda-citas-tables.sql
2. Buscar la declaración de FOREIGN KEY en 29

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/002-agenda-citas-tables.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
CONSTRAINT fk_servicio_sede_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Baja | 🟡 Media |
| **Performance** | Lenta | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Estándares de diseño de persistencia |
| **Reputación** | Baja velocidad de la plataforma |
| **Usuarios Impactados** | Usuarios recurrentes |
| **Costo Potencial** | Mayor consumo CPU |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Manual**
- Ventaja: Inmediato
- Desventaja: Difícil mantener
- Esfuerzo: Bajo

**Opción B: Índice en script de migración** (Recomendada)
- Ventaja: Consistente
- Desventaja: Requiere pruebas de lock
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- CREATE INDEX idx_tabla_fk ON tabla(columna_id)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
CONSTRAINT fk_servicio_sede_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-agendador_fk ON tabla_afectada(columna_id);
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
- CWE-707: Improper Enforcement of Message or Data Structure
- Mejores prácticas de Base de Datos

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-IDX-BACKEND-AGENDADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:41 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/002-agenda-citas-tables.sql que carece de índice asociado.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Declaración de FOREIGN KEY sin INDEX complementario.
- **Escenario de Riesgo:** Escaneos secuenciales lentos durante JOINs masivos.
- **Consecuencia:** Retardos de respuesta en el API.

#### 1.3 ¿A quién afecta?
Base de datos relacional

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql:41
CONSTRAINT fk_requisito_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/002-agenda-citas-tables.sql
2. Buscar la declaración de FOREIGN KEY en 41

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/002-agenda-citas-tables.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
CONSTRAINT fk_requisito_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Baja | 🟡 Media |
| **Performance** | Lenta | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Estándares de diseño de persistencia |
| **Reputación** | Baja velocidad de la plataforma |
| **Usuarios Impactados** | Usuarios recurrentes |
| **Costo Potencial** | Mayor consumo CPU |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Manual**
- Ventaja: Inmediato
- Desventaja: Difícil mantener
- Esfuerzo: Bajo

**Opción B: Índice en script de migración** (Recomendada)
- Ventaja: Consistente
- Desventaja: Requiere pruebas de lock
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- CREATE INDEX idx_tabla_fk ON tabla(columna_id)

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
CONSTRAINT fk_requisito_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-agendador_fk ON tabla_afectada(columna_id);
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
- CWE-707: Improper Enforcement of Message or Data Structure
- Mejores prácticas de Base de Datos

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-BATCH-BACKEND-AGENDADOR] Ausencia de Configuración de Procesamiento por Lotes (Batching) y Riesgo N+1

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/application.properties |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | JPA/Hibernate Performance Tuning |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo de propiedades no configura el procesamiento en lote (batching) en el ORM, lo que incrementa el riesgo de problemas N+1 y baja eficiencia en persistencias masivas.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Falta de propiedades específicas de Hibernate para agrupar inserciones y actualizaciones en lotes (batch_size).
- **Escenario de Riesgo:** Inserción o modificación masiva de entidades relacionales enviando múltiples declaraciones individuales.
- **Consecuencia:** Saturación rápida del pool de conexiones de la base de datos y latencia alta.

#### 1.3 ¿A quién afecta?
Base de Datos y Backend API

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application.properties
Falta de propiedades: spring.jpa.properties.hibernate.jdbc.batch_size
```

#### 2.2 Pasos para Reproducir
1. Revisar application.properties
2. Observar múltiples INSERT unitarios en consola en lugar de un lote

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn 'batch_size' src/
```

#### 2.4 Output/Respuesta Observada
```
Ninguna configuración de batching encontrada
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Latencia en inserciones masivas | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Principios de rendimiento de JPA/Hibernate |
| **Reputación** | Tiempos de respuesta lentos |
| **Usuarios Impactados** | Procesos batch de negocio |
| **Costo Potencial** | Ninguno |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Queries nativas**
- Ventaja: Control total
- Desventaja: Pierde abstracciones ORM
- Esfuerzo: Medio

**Opción B: Propiedades de lote en Hibernate** (Recomendada)
- Ventaja: Optimiza automáticamente llamadas del ORM
- Desventaja: Requiere pruebas de compatibilidad de IDs
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada.
3. Validar en local y correr regresiones.

#### 4.3 Tecnologías/Patterns Sugeridos
- spring.jpa.properties.hibernate.jdbc.batch_size=20\nspring.jpa.properties.hibernate.order_inserts=true\nspring.jpa.properties.hibernate.order_updates=true

#### 4.4 Código de Corrección Sugerido (Antes/Después)

**Código Inseguro / Estado Anterior:**
```
Falta de propiedades: spring.jpa.properties.hibernate.jdbc.batch_size
```

**Código Corregido / Solución:**
```
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
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
- CWE-400: Uncontrolled Resource Consumption
- JPA/Hibernate Performance Tuning

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-13 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-CMP-BACKEND-AGENDADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-agendador/src/main/java/citas/agenda/domain/service/cita/CitaService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/citas/agenda/domain/service/cita/CitaService.java presenta una complejidad cognitiva estimada de 25, superando el umbral recomendado de 15.

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
// Ubicación: backend-agendador/src/main/java/citas/agenda/domain/service/cita/CitaService.java
Línea 49: if (CanalAgendamiento.CIUDADANO.equals(canal)) {
Línea 50: if (request.getCorreo() == null || request.getCorreo().isBlank()) {
Línea 53: if (request.getCodigoValidacion() == null || request.getCodigoValidacion().isBlank()) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/citas/agenda/domain/service/cita/CitaService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/citas/agenda/domain/service/cita/CitaService.java | grep -E 'if|for|while|catch'
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
Línea 49: if (CanalAgendamiento.CIUDADANO.equals(canal)) {
Línea 50: if (request.getCorreo() == null || request.getCorreo().isBlank()) {
Línea 53: if (request.getCodigoValidacion() == null || request.getCodigoValidacion().isBlank()) {
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

## [PERF-CMP-BACKEND-AGENDADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-agendador/src/main/java/citas/agenda/domain/service/cita/CitaDisponibilidadService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/citas/agenda/domain/service/cita/CitaDisponibilidadService.java presenta una complejidad cognitiva estimada de 26, superando el umbral recomendado de 15.

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
// Ubicación: backend-agendador/src/main/java/citas/agenda/domain/service/cita/CitaDisponibilidadService.java
Línea 36: if (diaInhabilRepository.existsBySedeIdAndFechaAndBoborradoFalse(sedeId, fecha)) {
Línea 41: if (vigencia == null) return Collections.emptyList();
Línea 44: if (sede == null) return Collections.emptyList();
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/citas/agenda/domain/service/cita/CitaDisponibilidadService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/citas/agenda/domain/service/cita/CitaDisponibilidadService.java | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 26
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
Línea 36: if (diaInhabilRepository.existsBySedeIdAndFechaAndBoborradoFalse(sedeId, fecha)) {
Línea 41: if (vigencia == null) return Collections.emptyList();
Línea 44: if (sede == null) return Collections.emptyList();
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

## [PERF-CMP-BACKEND-AGENDADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-agendador/src/main/java/citas/agenda/domain/service/cita/TokenService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/citas/agenda/domain/service/cita/TokenService.java presenta una complejidad cognitiva estimada de 16, superando el umbral recomendado de 15.

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
// Ubicación: backend-agendador/src/main/java/citas/agenda/domain/service/cita/TokenService.java
Línea 31: if (sedeId != null && fechaHora != null) {
Línea 33: if (!disponible) {
Línea 39: if (sedeId != null && servicioId != null) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/citas/agenda/domain/service/cita/TokenService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/citas/agenda/domain/service/cita/TokenService.java | grep -E 'if|for|while|catch'
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
Línea 31: if (sedeId != null && fechaHora != null) {
Línea 33: if (!disponible) {
Línea 39: if (sedeId != null && servicioId != null) {
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

