# Reporte de Hallazgos - Proyecto: BACKEND-ENVIO-CORREOS

**Fecha:** 2026-07-09  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-SEC-BACKEND-ENVIO-CORREOS] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-envio-correos  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-envio-correos/src/main/resources/application-local.properties:7 |
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
// Ubicación: backend-envio-correos/src/main/resources/application-local.properties:7
spring.datasource.password=starter
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-local.properties
2. Observar línea 7

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-local.properties | grep -n 'spring.datasource.password'
```

#### 2.4 Output/Respuesta Observada
```
spring.datasource.password=starter
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
spring.datasource.password=starter
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-SEC-BACKEND-ENVIO-CORREOS] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-envio-correos  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-envio-correos/src/main/resources/application-dev.properties:7 |
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
// Ubicación: backend-envio-correos/src/main/resources/application-dev.properties:7
spring.datasource.password=wFo1nCKfWrs7!noLT5_l
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-dev.properties
2. Observar línea 7

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-dev.properties | grep -n 'spring.datasource.password'
```

#### 2.4 Output/Respuesta Observada
```
spring.datasource.password=wFo1nCKfWrs7!noLT5_l
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
spring.datasource.password=wFo1nCKfWrs7!noLT5_l
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [SEC-SEC-BACKEND-ENVIO-CORREOS] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-envio-correos  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-envio-correos/src/main/resources/application-dev.properties:13 |
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
// Ubicación: backend-envio-correos/src/main/resources/application-dev.properties:13
spring.liquibase.password=glB6NEe!@x5L5FyO3Iwg
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-dev.properties
2. Observar línea 13

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-dev.properties | grep -n 'spring.liquibase.password'
```

#### 2.4 Output/Respuesta Observada
```
spring.liquibase.password=glB6NEe!@x5L5FyO3Iwg
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
spring.liquibase.password=glB6NEe!@x5L5FyO3Iwg
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
spring.liquibase.password = ${SPRING.LIQUIBASE.PASSWORD_ENV}
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

## [PERF-BATCH-BACKEND-ENVIO-CORREOS] Ausencia de Configuración de Procesamiento por Lotes (Batching) y Riesgo N+1

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-envio-correos  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-envio-correos/src/main/resources/application.properties |
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
// Ubicación: backend-envio-correos/src/main/resources/application.properties
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
| 2026-07-09 | 🔴 Abierto | AuraAudit | Detectado automáticamente |

---


---

