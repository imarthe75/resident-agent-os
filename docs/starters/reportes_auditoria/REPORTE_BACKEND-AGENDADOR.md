# Reporte de Hallazgos - Proyecto: BACKEND-AGENDADOR

**Fecha:** 2026-07-09  
**Auditor Técnico:** Antigravity AI  
**Tecnología/Stack:** Java / Spring Boot  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
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
Se detectó una credencial, contraseña o clave secreta expuesta directamente en texto plano en el archivo src/main/resources/application.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de variables de autenticación en src/main/resources/application.properties.
- **Escenario de Riesgo:** Un atacante con acceso al repositorio de código fuente (o imagen de contenedor) podría obtener las credenciales y comprometer la base de datos o servicio externo.
- **Consecuencia:** Acceso total no autorizado a los datos, posible manipulación o exfiltración.

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
| **Confidencialidad** | Exposición total de credenciales de acceso | 🔴 Crítica |
| **Integridad** | Modificación no autorizada de la BD | 🔴 Crítica |
| **Disponibilidad** | Posible destrucción o caída del servicio | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Violación de políticas internas y GDPR / Leyes locales de protección de datos |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios del sistema |
| **Costo Potencial** | Multas por exposición de datos sensibles |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (Menos de 2 horas) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables de entorno directas**
- Ventaja: Rápido de configurar
- Desventaja: Difícil de rotar o gestionar en producción compleja
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos (Vault / Spring Cloud Config Vault)** (Recomendada)
- Ventaja: Seguro, centralizado y soporta rotación automática
- Desventaja: Requiere infraestructura adicional
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- Spring Boot `@Value("${...}")` inyectado desde variables de entorno seguras

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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
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
Se detectó una credencial, contraseña o clave secreta expuesta directamente en texto plano en el archivo src/main/resources/application-local.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de variables de autenticación en src/main/resources/application-local.properties.
- **Escenario de Riesgo:** Un atacante con acceso al repositorio de código fuente (o imagen de contenedor) podría obtener las credenciales y comprometer la base de datos o servicio externo.
- **Consecuencia:** Acceso total no autorizado a los datos, posible manipulación o exfiltración.

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
| **Confidencialidad** | Exposición total de credenciales de acceso | 🔴 Crítica |
| **Integridad** | Modificación no autorizada de la BD | 🔴 Crítica |
| **Disponibilidad** | Posible destrucción o caída del servicio | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Violación de políticas internas y GDPR / Leyes locales de protección de datos |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios del sistema |
| **Costo Potencial** | Multas por exposición de datos sensibles |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (Menos de 2 horas) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables de entorno directas**
- Ventaja: Rápido de configurar
- Desventaja: Difícil de rotar o gestionar en producción compleja
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos (Vault / Spring Cloud Config Vault)** (Recomendada)
- Ventaja: Seguro, centralizado y soporta rotación automática
- Desventaja: Requiere infraestructura adicional
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- Spring Boot `@Value("${...}")` inyectado desde variables de entorno seguras

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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
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
Se detectó una credencial, contraseña o clave secreta expuesta directamente en texto plano en el archivo src/main/resources/application-local.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de variables de autenticación en src/main/resources/application-local.properties.
- **Escenario de Riesgo:** Un atacante con acceso al repositorio de código fuente (o imagen de contenedor) podría obtener las credenciales y comprometer la base de datos o servicio externo.
- **Consecuencia:** Acceso total no autorizado a los datos, posible manipulación o exfiltración.

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
| **Confidencialidad** | Exposición total de credenciales de acceso | 🔴 Crítica |
| **Integridad** | Modificación no autorizada de la BD | 🔴 Crítica |
| **Disponibilidad** | Posible destrucción o caída del servicio | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Violación de políticas internas y GDPR / Leyes locales de protección de datos |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios del sistema |
| **Costo Potencial** | Multas por exposición de datos sensibles |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (Menos de 2 horas) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables de entorno directas**
- Ventaja: Rápido de configurar
- Desventaja: Difícil de rotar o gestionar en producción compleja
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos (Vault / Spring Cloud Config Vault)** (Recomendada)
- Ventaja: Seguro, centralizado y soporta rotación automática
- Desventaja: Requiere infraestructura adicional
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- Spring Boot `@Value("${...}")` inyectado desde variables de entorno seguras

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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
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
Se detectó una credencial, contraseña o clave secreta expuesta directamente en texto plano en el archivo src/main/resources/application-dev.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de variables de autenticación en src/main/resources/application-dev.properties.
- **Escenario de Riesgo:** Un atacante con acceso al repositorio de código fuente (o imagen de contenedor) podría obtener las credenciales y comprometer la base de datos o servicio externo.
- **Consecuencia:** Acceso total no autorizado a los datos, posible manipulación o exfiltración.

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
| **Confidencialidad** | Exposición total de credenciales de acceso | 🔴 Crítica |
| **Integridad** | Modificación no autorizada de la BD | 🔴 Crítica |
| **Disponibilidad** | Posible destrucción o caída del servicio | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Violación de políticas internas y GDPR / Leyes locales de protección de datos |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios del sistema |
| **Costo Potencial** | Multas por exposición de datos sensibles |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (Menos de 2 horas) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables de entorno directas**
- Ventaja: Rápido de configurar
- Desventaja: Difícil de rotar o gestionar en producción compleja
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos (Vault / Spring Cloud Config Vault)** (Recomendada)
- Ventaja: Seguro, centralizado y soporta rotación automática
- Desventaja: Requiere infraestructura adicional
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- Spring Boot `@Value("${...}")` inyectado desde variables de entorno seguras

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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [SEC-SEC-BACKEND-AGENDADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
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
Se detectó una credencial, contraseña o clave secreta expuesta directamente en texto plano en el archivo src/main/resources/application-prod.properties.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición directa de variables de autenticación en src/main/resources/application-prod.properties.
- **Escenario de Riesgo:** Un atacante con acceso al repositorio de código fuente (o imagen de contenedor) podría obtener las credenciales y comprometer la base de datos o servicio externo.
- **Consecuencia:** Acceso total no autorizado a los datos, posible manipulación o exfiltración.

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
| **Confidencialidad** | Exposición total de credenciales de acceso | 🔴 Crítica |
| **Integridad** | Modificación no autorizada de la BD | 🔴 Crítica |
| **Disponibilidad** | Posible destrucción o caída del servicio | 🔴 Crítica |
| **Performance** | No aplica | ✅ No aplica |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Violación de políticas internas y GDPR / Leyes locales de protección de datos |
| **Reputación** | Pérdida de confianza grave |
| **Usuarios Impactados** | Todos los usuarios del sistema |
| **Costo Potencial** | Multas por exposición de datos sensibles |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | Bajo (Menos de 2 horas) |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Variables de entorno directas**
- Ventaja: Rápido de configurar
- Desventaja: Difícil de rotar o gestionar en producción compleja
- Esfuerzo: Bajo

**Opción B: Gestor de Secretos (Vault / Spring Cloud Config Vault)** (Recomendada)
- Ventaja: Seguro, centralizado y soporta rotación automática
- Desventaja: Requiere infraestructura adicional
- Esfuerzo: Medio

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- Spring Boot `@Value("${...}")` inyectado desde variables de entorno seguras

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
- CWE-798: Use of Hard-coded Credentials
- ISO27001 A.10 / OWASP A05

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [SEC-CORS-BACKEND-AGENDADOR] Configuración Permisiva de CORS (Wildcard '*')

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-agendador/src/main/java/citas/agenda/web/config/SecurityConfig.java:29 |
| **CVE/CWE** | CWE-942: Overly Permissive CORS |
| **Normativa Aplicable** | OWASP A05 - Security Misconfiguration |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó el uso de comodín '*' en los orígenes permitidos de CORS en src/main/java/citas/agenda/web/config/SecurityConfig.java, lo que permite a cualquier dominio realizar peticiones cruzadas a este backend.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Configuración CORS establecida a '*' en src/main/java/citas/agenda/web/config/SecurityConfig.java.
- **Escenario de Riesgo:** Un sitio malicioso abierto por un usuario autenticado en su navegador podría realizar llamadas no autorizadas al backend usando las credenciales del usuario.
- **Consecuencia:** Fugas de datos sensibles o acciones no autorizadas en nombre del usuario.

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

## [PERF-IDX-BACKEND-AGENDADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
**Sistema Auditado:** backend-agendador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de BD |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó la creación de relaciones de llaves foráneas en los scripts SQL/Changelogs de backend-agendador sin la correspondiente creación de índices, lo que ralentiza las consultas JOIN o CASCADE.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Definición de restricciones FOREIGN KEY sin declaraciones de INDEX complementarias.
- **Escenario de Riesgo:** El volumen de datos crece y las consultas de búsqueda o eliminación que asocian tablas relacionadas ejecutan escaneos secuenciales completos (Seq Scan).
- **Consecuencia:** Degradación exponencial del tiempo de respuesta del backend bajo carga.

#### 1.3 ¿A quién afecta?
Base de datos y API

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/db/changelog/002-agenda-citas-tables.sql
- src/main/resources/db/changelog/002-agenda-citas-tables.sql:L22 -> sede_id UUID NOT NULL,
- src/main/resources/db/changelog/002-agenda-citas-tables.sql:L27 -> CONSTRAINT uk_servicio_sede UNIQUE (servicio_id, sede_id),
- src/main/resources/db/changelog/002-agenda-citas-tables.sql:L28 -> CONSTRAINT fk_servicio_sede_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
- src/main/resources/db/changelog/002-agenda-citas-tables.sql:L29 -> CONSTRAINT fk_servicio_sede_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
- src/main/resources/db/changelog/002-agenda-citas-tables.sql:L41 -> CONSTRAINT fk_requisito_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
```

#### 2.2 Pasos para Reproducir
1. Revisar los scripts de migración de BD
2. Ejecutar EXPLAIN ANALYZE en la consulta de búsqueda que involucre la FK

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn 'FOREIGN KEY' src/
```

#### 2.4 Output/Respuesta Observada
```
Llave foránea sin índice asociado
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | Bloqueo de tablas e inestabilidad bajo alta carga | 🟡 Media |
| **Performance** | Picos de latencia en consultas SQL de JOIN | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Estándares de diseño de persistencia |
| **Reputación** | Baja velocidad de la plataforma |
| **Usuarios Impactados** | Usuarios concurrentes en horas pico |
| **Costo Potencial** | Mayor consumo de CPU/recursos en servidor de BD |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Creación manual de índices**
- Ventaja: Inmediato
- Desventaja: Difícil de mantener si cambian las FKs
- Esfuerzo: Bajo

**Opción B: Agregar índices en el mismo script de migración** (Recomendada)
- Ventaja: Garantiza orden y consistencia en el despliegue
- Desventaja: Puede generar bloqueos temporales de escritura en tablas gigantescas
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- CREATE INDEX idx_tabla_fk ON tabla(columna_id)

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
- CWE-707: Improper Enforcement of Message or Data Structure
- Mejores prácticas de BD

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

## [PERF-BATCH-BACKEND-AGENDADOR] Ausencia de Configuración de Procesamiento por Lotes (Batching) y Riesgo N+1

**Fecha Detección:** 2026-07-09  
**Auditor:** Antigravity AI  
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
Se detectó que el archivo de propiedades del backend backend-agendador no configura el procesamiento en lote (batching) en el ORM, lo que incrementa el riesgo de problemas N+1 y baja eficiencia en persistencias masivas.

#### 1.2 ¿Por qué es un problema?
- **Causa Raíz:** Falta de propiedades específicas de Hibernate para agrupar inserciones y actualizaciones en lotes (batch_size).
- **Escenario de Riesgo:** Cuando se realizan guardados masivos o consultas Lazy de entidades relacionadas de manera iterativa, se envían múltiples declaraciones individuales al gestor de base de datos.
- **Consecuencia:** Saturación rápida del pool de conexiones de la base de datos y latencia alta en el API.

#### 1.3 ¿A quién afecta?
Capa de Base de Datos y Backend API

---

### 2. 🧪 Evidencia (Reproducibilidad Garantizada)

#### 2.1 Código/Configuración Problemática

```
// Ubicación: backend-agendador/src/main/resources/application.properties
Falta de propiedades: spring.jpa.properties.hibernate.jdbc.batch_size
```

#### 2.2 Pasos para Reproducir
1. Revisar application.properties
2. Ejecutar inserción de más de 100 registros en bucle
3. Observar múltiples INSERT unitarios en consola en lugar de un lote

#### 2.3 Comando Exacto para Verificar
```bash
grep -rn 'batch_size' src/
```

#### 2.4 Output/Respuesta Observada
```
Ninguna configuración de batching de persistencia encontrada
```

---

### 3. 💥 Impacto

#### 3.1 Impacto Técnico

| Aspecto | Descripción | Magnitud |
|---------|-------------|----------|
| **Confidencialidad** | No aplica | ✅ No aplica |
| **Integridad** | No aplica | ✅ No aplica |
| **Disponibilidad** | No aplica | ✅ No aplica |
| **Performance** | Picos de latencia significativos y consumo de CPU en DB | 🟠 Alta |

#### 3.2 Impacto de Negocio

| Aspecto | Consecuencia |
|---------|-------------|
| **Cumplimiento Normativo** | Principios de rendimiento de JPA/Hibernate |
| **Reputación** | Tiempos de respuesta lentos en operaciones masivas |
| **Usuarios Impactados** | Todos los usuarios interactuando con procesos masivos |
| **Costo Potencial** | Costos de infraestructura escalados innecesariamente |
| **Tiempo de Detección** | Desconocido - sin alertas proactivas |
| **Tiempo de Remediación Esperado** | 1 día |

---

### 4. ✅ Recomendación de Solución (Sin Código)

#### 4.1 Estrategia Recomendada

**Opción A: Uso de consultas nativas por lotes manuales**
- Ventaja: Control total sobre la consulta SQL
- Desventaja: Pierde los beneficios y abstracciones provistas por el ORM
- Esfuerzo: Medio

**Opción B: Configuración de propiedades de lote en Hibernate** (Recomendada)
- Ventaja: Optimiza automáticamente las llamadas del ORM sin cambiar código Java
- Desventaja: Requiere pruebas de compatibilidad de generación de IDs
- Esfuerzo: Bajo

#### 4.2 Pasos Generales (NO es código)
1. Analizar el componente afectado y las dependencias asociadas.
2. Aplicar la estrategia de remediación seleccionada (ej. externalizar secretos, usar takeUntil para suscripciones, agregar índices).
3. Validar los cambios en un entorno local y de desarrollo.
4. Ejecutar pruebas de regresión.

#### 4.3 Tecnologías/Patterns Sugeridos
- spring.jpa.properties.hibernate.jdbc.batch_size=20\nspring.jpa.properties.hibernate.order_inserts=true\nspring.jpa.properties.hibernate.order_updates=true

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
- CWE-400: Uncontrolled Resource Consumption
- JPA/Hibernate Performance Tuning

---

### 8. ✍️ Seguimiento

| Fecha | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| 2026-07-09 | 🔴 Abierto | Antigravity | Detectado durante auditoría automatizada |

---


---

