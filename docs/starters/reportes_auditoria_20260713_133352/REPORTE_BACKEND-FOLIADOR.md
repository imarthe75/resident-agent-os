# Reporte de Hallazgos - Proyecto: BACKEND-FOLIADOR

**Fecha:** 2026-07-13  
**Auditor:** AuraAudit Engine  

---

## 📝 RESUMEN DE HALLAZGOS DETECTADOS

## [SEC-SEC-BACKEND-FOLIADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-foliador/src/main/resources/application-local.properties:7 |
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
// Ubicación: backend-foliador/src/main/resources/application-local.properties:7
spring.datasource.password=postgres
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
spring.datasource.password=postgres
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
spring.datasource.password=postgres
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

## [SEC-SEC-BACKEND-FOLIADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-foliador/src/main/resources/application-dev.properties:7 |
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
// Ubicación: backend-foliador/src/main/resources/application-dev.properties:7
spring.datasource.password=p6GouQ#VR298Ps9gLrkq
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

## [SEC-SEC-BACKEND-FOLIADOR] Secreto o Credencial Hardcodeado en Archivo de Configuración

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🔴 Crítica |
| **Categoría** | Seguridad |
| **Componente Afectado** | backend-foliador/src/main/resources/application-prod.properties:7 |
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
// Ubicación: backend-foliador/src/main/resources/application-prod.properties:7
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:p6GouQ#VR298Ps9gLrkq}
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
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:p6GouQ#VR298Ps9gLrkq}
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
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:p6GouQ#VR298Ps9gLrkq}
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

## [PERF-IDX-BACKEND-FOLIADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql:65 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql que carece de índice asociado.

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
// Ubicación: backend-foliador/src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql:65
FOREIGN KEY (sistema_id)
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql
2. Buscar la declaración de FOREIGN KEY en 65

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
FOREIGN KEY (sistema_id)
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
FOREIGN KEY (sistema_id)
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-foliador_fk ON tabla_afectada(columna_id);
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

## [PERF-IDX-BACKEND-FOLIADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql:66 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql que carece de índice asociado.

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
// Ubicación: backend-foliador/src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql:66
REFERENCES public.sistemas(id);
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql
2. Buscar la declaración de FOREIGN KEY en 66

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/20260620_0002_create_tipo_folios.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
REFERENCES public.sistemas(id);
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
REFERENCES public.sistemas(id);
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-foliador_fk ON tabla_afectada(columna_id);
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

## [PERF-IDX-BACKEND-FOLIADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:64 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql que carece de índice asociado.

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
// Ubicación: backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:64
ALTER TABLE public.folio_consecutivos ADD CONSTRAINT fk_folio_consecutivos__sistemas FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id);
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql
2. Buscar la declaración de FOREIGN KEY en 64

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
ALTER TABLE public.folio_consecutivos ADD CONSTRAINT fk_folio_consecutivos__sistemas FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id);
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
ALTER TABLE public.folio_consecutivos ADD CONSTRAINT fk_folio_consecutivos__sistemas FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id);
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-foliador_fk ON tabla_afectada(columna_id);
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

## [PERF-IDX-BACKEND-FOLIADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:67 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql que carece de índice asociado.

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
// Ubicación: backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:67
ALTER TABLE public.folio_consecutivos ADD CONSTRAINT fk_folio_consecutivos__tipo_folios FOREIGN KEY (tipo_folio_id) REFERENCES public.tipo_folios(id);
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql
2. Buscar la declaración de FOREIGN KEY en 67

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
ALTER TABLE public.folio_consecutivos ADD CONSTRAINT fk_folio_consecutivos__tipo_folios FOREIGN KEY (tipo_folio_id) REFERENCES public.tipo_folios(id);
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
ALTER TABLE public.folio_consecutivos ADD CONSTRAINT fk_folio_consecutivos__tipo_folios FOREIGN KEY (tipo_folio_id) REFERENCES public.tipo_folios(id);
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-foliador_fk ON tabla_afectada(columna_id);
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

## [PERF-IDX-BACKEND-FOLIADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:74 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql que carece de índice asociado.

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
// Ubicación: backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:74
ALTER TABLE public.folios_emitidos ADD CONSTRAINT fk_folios_emitidos__sistemas FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id);
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql
2. Buscar la declaración de FOREIGN KEY en 74

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
ALTER TABLE public.folios_emitidos ADD CONSTRAINT fk_folios_emitidos__sistemas FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id);
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
ALTER TABLE public.folios_emitidos ADD CONSTRAINT fk_folios_emitidos__sistemas FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id);
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-foliador_fk ON tabla_afectada(columna_id);
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

## [PERF-IDX-BACKEND-FOLIADOR] Ausencia de Índices en Llaves Foráneas (FK) de Base de Datos

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟠 Alta |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:77 |
| **CVE/CWE** | CWE-707: Improper Enforcement of Message or Data Structure |
| **Normativa Aplicable** | Mejores prácticas de Base de Datos |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
Se detectó una relación FK en src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql que carece de índice asociado.

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
// Ubicación: backend-foliador/src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql:77
ALTER TABLE public.folios_emitidos ADD CONSTRAINT fk_folios_emitidos__tipo_folios FOREIGN KEY (tipo_folio_id) REFERENCES public.tipo_folios(id);
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql
2. Buscar la declaración de FOREIGN KEY en 77

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/resources/db/changelog/20260620_0003_create_folios_y_consecutivos.sql | grep -n 'FOREIGN KEY'
```

#### 2.4 Output/Respuesta Observada
```
ALTER TABLE public.folios_emitidos ADD CONSTRAINT fk_folios_emitidos__tipo_folios FOREIGN KEY (tipo_folio_id) REFERENCES public.tipo_folios(id);
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
ALTER TABLE public.folios_emitidos ADD CONSTRAINT fk_folios_emitidos__tipo_folios FOREIGN KEY (tipo_folio_id) REFERENCES public.tipo_folios(id);
```

**Código Corregido / Solución:**
```
-- Crear índice para agilizar búsquedas sobre la FK
CREATE INDEX idx_backend-foliador_fk ON tabla_afectada(columna_id);
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

## [PERF-BATCH-BACKEND-FOLIADOR] Ausencia de Configuración de Procesamiento por Lotes (Batching) y Riesgo N+1

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Rendimiento |
| **Componente Afectado** | backend-foliador/src/main/resources/application.properties |
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
// Ubicación: backend-foliador/src/main/resources/application.properties
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

## [PERF-CMP-BACKEND-FOLIADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-foliador/src/main/java/com/starter/foliador/security/SecurityUtils.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/starter/foliador/security/SecurityUtils.java presenta una complejidad cognitiva estimada de 19, superando el umbral recomendado de 15.

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
// Ubicación: backend-foliador/src/main/java/com/starter/foliador/security/SecurityUtils.java
Línea 49: if (authentication == null) {
Línea 53: if (authentication instanceof ApiKeyAuthentication apiKeyAuth) {
Línea 57: if (authentication instanceof JwtAuthenticationToken jwtAuth) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/starter/foliador/security/SecurityUtils.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/starter/foliador/security/SecurityUtils.java | grep -E 'if|for|while|catch'
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
Línea 49: if (authentication == null) {
Línea 53: if (authentication instanceof ApiKeyAuthentication apiKeyAuth) {
Línea 57: if (authentication instanceof JwtAuthenticationToken jwtAuth) {
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

## [PERF-CMP-BACKEND-FOLIADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-foliador/src/main/java/com/starter/foliador/audit/AuditPersistenceService.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/starter/foliador/audit/AuditPersistenceService.java presenta una complejidad cognitiva estimada de 19, superando el umbral recomendado de 15.

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
// Ubicación: backend-foliador/src/main/java/com/starter/foliador/audit/AuditPersistenceService.java
Línea 59: if (auth != null && auth.isAuthenticated()) {
Línea 60: if (auth instanceof ApiKeyAuthentication apiKeyAuth) {
Línea 64: } else if (auth instanceof JwtAuthenticationToken jwtAuth) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/starter/foliador/audit/AuditPersistenceService.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/starter/foliador/audit/AuditPersistenceService.java | grep -E 'if|for|while|catch'
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
Línea 59: if (auth != null && auth.isAuthenticated()) {
Línea 60: if (auth instanceof ApiKeyAuthentication apiKeyAuth) {
Línea 64: } else if (auth instanceof JwtAuthenticationToken jwtAuth) {
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

## [PERF-CMP-BACKEND-FOLIADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-foliador/src/main/java/com/starter/foliador/audit/AuditServiceImpl.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/starter/foliador/audit/AuditServiceImpl.java presenta una complejidad cognitiva estimada de 39, superando el umbral recomendado de 15.

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
// Ubicación: backend-foliador/src/main/java/com/starter/foliador/audit/AuditServiceImpl.java
Línea 50: if (attributes != null) {
Línea 59: } catch (Exception e) {
Línea 71: if (request == null) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/starter/foliador/audit/AuditServiceImpl.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/starter/foliador/audit/AuditServiceImpl.java | grep -E 'if|for|while|catch'
```

#### 2.4 Output/Respuesta Observada
```
Puntuación de complejidad estimada: 39
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
Línea 50: if (attributes != null) {
Línea 59: } catch (Exception e) {
Línea 71: if (request == null) {
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

## [PERF-CMP-BACKEND-FOLIADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-foliador/src/main/java/com/starter/foliador/service/impl/TipoFolioServiceImpl.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/starter/foliador/service/impl/TipoFolioServiceImpl.java presenta una complejidad cognitiva estimada de 26, superando el umbral recomendado de 15.

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
// Ubicación: backend-foliador/src/main/java/com/starter/foliador/service/impl/TipoFolioServiceImpl.java
Línea 45: if (!sistema.getBoActivo()) {
Línea 51: String normalizedPrefijo = request.getPrefijo() != null ? request.getPrefijo().trim().toUpperCase() : null;
Línea 52: String normalizedSufijo = request.getSufijo() != null ? request.getSufijo().trim().toUpperCase() : null;
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/starter/foliador/service/impl/TipoFolioServiceImpl.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/starter/foliador/service/impl/TipoFolioServiceImpl.java | grep -E 'if|for|while|catch'
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
Línea 45: if (!sistema.getBoActivo()) {
Línea 51: String normalizedPrefijo = request.getPrefijo() != null ? request.getPrefijo().trim().toUpperCase() : null;
Línea 52: String normalizedSufijo = request.getSufijo() != null ? request.getSufijo().trim().toUpperCase() : null;
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

## [PERF-CMP-BACKEND-FOLIADOR] Alta Complejidad Cognitiva en Archivo de Código Fuente

**Fecha Detección:** 2026-07-13  
**Auditor:** AuraAudit Engine  
**Sistema Auditado:** backend-foliador  

---

### 📌 Clasificación

| Atributo | Valor |
|----------|-------|
| **Severidad** | 🟡 Media |
| **Categoría** | Mantenibilidad |
| **Componente Afectado** | backend-foliador/src/main/java/com/starter/foliador/service/impl/EmisionFolioServiceImpl.java |
| **CVE/CWE** | CWE-400: Uncontrolled Resource Consumption |
| **Normativa Aplicable** | Clean Code / Principios de Mantenibilidad |

---

### 1. 📝 Descripción Detallada

#### 1.1 ¿Qué es el problema?
El archivo src/main/java/com/starter/foliador/service/impl/EmisionFolioServiceImpl.java presenta una complejidad cognitiva estimada de 28, superando el umbral recomendado de 15.

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
// Ubicación: backend-foliador/src/main/java/com/starter/foliador/service/impl/EmisionFolioServiceImpl.java
Línea 87: if (!Boolean.TRUE.equals(sistema.getBoActivo())) {
Línea 97: if (!Boolean.TRUE.equals(tipoFolio.getBoActivo())) {
Línea 103: if (Boolean.TRUE.equals(tipoFolio.getReinicioAnual())) {
```

#### 2.2 Pasos para Reproducir
1. Abrir src/main/java/com/starter/foliador/service/impl/EmisionFolioServiceImpl.java
2. Analizar el anidamiento y la longitud de las funciones principales.

#### 2.3 Comando Exacto para Verificar
```bash
cat src/main/java/com/starter/foliador/service/impl/EmisionFolioServiceImpl.java | grep -E 'if|for|while|catch'
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
Línea 87: if (!Boolean.TRUE.equals(sistema.getBoActivo())) {
Línea 97: if (!Boolean.TRUE.equals(tipoFolio.getBoActivo())) {
Línea 103: if (Boolean.TRUE.equals(tipoFolio.getReinicioAnual())) {
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

