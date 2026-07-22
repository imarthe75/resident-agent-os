# Reporte de Hallazgos - Proyecto: STARTER-JAVA-AUTHENTIK

**Fecha:** 2026-07-09  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-SEC-STARTER-JAVA-AUTHENTIK] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | starter-java-authentik/src/main/resources/application-local.properties:3 |
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
// Ubicación: starter-java-authentik/src/main/resources/application-local.properties:3
spring.datasource.password=starter
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-local.properties
2. Observar línea 3

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

## [SEC-SEC-STARTER-JAVA-AUTHENTIK] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | starter-java-authentik/src/main/resources/application-local.properties:8 |
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
// Ubicación: starter-java-authentik/src/main/resources/application-local.properties:8
app.ssl.truststore.password=changeit
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-local.properties
2. Observar línea 8

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-local.properties | grep -n 'app.ssl.truststore.password'
```

#### 2.4 Output/Respuesta Observada
```
app.ssl.truststore.password=changeit
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
app.ssl.truststore.password=changeit
```

**Código Corregido / Solución:**
```
# Inyectar el secreto mediante variable de entorno segura
app.ssl.truststore.password = ${APP.SSL.TRUSTSTORE.PASSWORD_ENV}
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

## [SEC-SEC-STARTER-JAVA-AUTHENTIK] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | starter-java-authentik/src/main/resources/application-dev.properties:3 |
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
// Ubicación: starter-java-authentik/src/main/resources/application-dev.properties:3
spring.datasource.password=starter
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/application-dev.properties
2. Observar línea 3

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/application-dev.properties | grep -n 'spring.datasource.password'
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

## [PERF-BATCH-STARTER-JAVA-AUTHENTIK] Ausencia de Configuración de Procesamiento por Lotes (Batching) y Riesgo N+1

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | starter-java-authentik/src/main/resources/application.properties |
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
// Ubicación: starter-java-authentik/src/main/resources/application.properties
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/RolService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/RolService.java presenta una complejidad cognitiva estimada de 24, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/RolService.java
Línea 60: } catch (DataIntegrityViolationException ex) {
Línea 101: if (request.codigo() != null) existente.setCodigo(normalizarCampoObligatorio(request.codigo(), "codigo"));
Línea 102: if (request.nombre() != null) existente.setNombre(normalizarCampoObligatorio(request.nombre(), "nombre"));
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/RolService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/RolService.java | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 24
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
Línea 60: } catch (DataIntegrityViolationException ex) {
Línea 101: if (request.codigo() != null) existente.setCodigo(normalizarCampoObligatorio(request.codigo(), "codigo"));
Línea 102: if (request.nombre() != null) existente.setNombre(normalizarCampoObligatorio(request.nombre(), "nombre"));
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/MenuService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/MenuService.java presenta una complejidad cognitiva estimada de 21, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/MenuService.java
Línea 55: menu.setPeso(request.peso() != null ? request.peso() : 100);
Línea 60: } catch (DataIntegrityViolationException ex) {
Línea 100: Long parentId = request.parentId() != null ? request.parentId() : existente.getParentId();
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/MenuService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/MenuService.java | grep -E 'if|for|while|catch'
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
Línea 55: menu.setPeso(request.peso() != null ? request.peso() : 100);
Línea 60: } catch (DataIntegrityViolationException ex) {
Línea 100: Long parentId = request.parentId() != null ? request.parentId() : existente.getParentId();
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/AuthentikUserService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/AuthentikUserService.java presenta una complejidad cognitiva estimada de 36, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/AuthentikUserService.java
Línea 43: if (payload == null || !payload.containsKey("results") || !(payload.get("results") instanceof List<?> rawUsers)) {
Línea 48: for (Object userItem : rawUsers) {
Línea 49: if (userItem instanceof Map<?, ?> rawUser) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/AuthentikUserService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/AuthentikUserService.java | grep -E 'if|for|while|catch'
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
Línea 43: if (payload == null || !payload.containsKey("results") || !(payload.get("results") instanceof List<?> rawUsers)) {
Línea 48: for (Object userItem : rawUsers) {
Línea 49: if (userItem instanceof Map<?, ?> rawUser) {
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/UsuarioService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/UsuarioService.java presenta una complejidad cognitiva estimada de 73, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/UsuarioService.java
Línea 122: if (request.primerApellido() != null) existente.setPrimerApellido(request.primerApellido());
Línea 123: if (request.segundoApellido() != null) existente.setSegundoApellido(request.segundoApellido());
Línea 124: if (request.nombres() != null) existente.setNombres(request.nombres());
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/UsuarioService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/UsuarioService.java | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 73
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
Línea 122: if (request.primerApellido() != null) existente.setPrimerApellido(request.primerApellido());
Línea 123: if (request.segundoApellido() != null) existente.setSegundoApellido(request.segundoApellido());
Línea 124: if (request.nombres() != null) existente.setNombres(request.nombres());
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/CatalogoService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/CatalogoService.java presenta una complejidad cognitiva estimada de 21, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/CatalogoService.java
Línea 58: } catch (DataIntegrityViolationException ex) {
Línea 89: ? ctCatalogoRepository.findAllByOrderByNombreAsc()
Línea 105: if (request.nombre() != null) existente.setNombre(normalizarObligatorio(request.nombre(), "nombre"));
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/CatalogoService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/CatalogoService.java | grep -E 'if|for|while|catch'
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
Línea 58: } catch (DataIntegrityViolationException ex) {
Línea 89: ? ctCatalogoRepository.findAllByOrderByNombreAsc()
Línea 105: if (request.nombre() != null) existente.setNombre(normalizarObligatorio(request.nombre(), "nombre"));
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/UsuarioSesionService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/UsuarioSesionService.java presenta una complejidad cognitiva estimada de 30, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/UsuarioSesionService.java
Línea 69: if (rolActivoId != null) {
Línea 70: for (Menu menu : menuService.listarMenusPorRol(rolActivoId)) {
Línea 95: if (usuarioRepository.findById(uuidDesdeSub).isPresent()) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/UsuarioSesionService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/UsuarioSesionService.java | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 30
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
Línea 69: if (rolActivoId != null) {
Línea 70: for (Menu menu : menuService.listarMenusPorRol(rolActivoId)) {
Línea 95: if (usuarioRepository.findById(uuidDesdeSub).isPresent()) {
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

## [PERF-CMP-STARTER-JAVA-AUTHENTIK] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-09  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** starter-java-authentik  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | starter-java-authentik/src/main/java/com/casmarts/starter/services/BootstrapAdminProvisioningService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/casmarts/starter/services/BootstrapAdminProvisioningService.java presenta una complejidad cognitiva estimada de 23, superando el umbral recomendado de 15.

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
// Ubicación: starter-java-authentik/src/main/java/com/casmarts/starter/services/BootstrapAdminProvisioningService.java
Línea 64: if (usuarioRolRepository.existeUsuarioActivoConRolCodigo(CODIGO_ROL_SUPER_ADMIN)) {
Línea 95: if (usuario.getPrimerApellido() == null && request.primerApellido() != null
Línea 96: || usuario.getSegundoApellido() == null && request.segundoApellido() != null
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/casmarts/starter/services/BootstrapAdminProvisioningService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/casmarts/starter/services/BootstrapAdminProvisioningService.java | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 23
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
Línea 64: if (usuarioRolRepository.existeUsuarioActivoConRolCodigo(CODIGO_ROL_SUPER_ADMIN)) {
Línea 95: if (usuario.getPrimerApellido() == null && request.primerApellido() != null
Línea 96: || usuario.getSegundoApellido() == null && request.segundoApellido() != null
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

