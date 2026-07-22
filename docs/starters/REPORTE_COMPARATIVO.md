# 📊 REPORTE COMPARATIVO DE AUDITORÍA: ANTERIOR vs. NUEVA EVALUACIÓN (CON ESTÁNDARES AMPLIADOS)

**Fecha de Ejecución:** 2026-07-13  
**Auditor:** AuraAudit Engine & Antigravity AI  
**Directorio de Reportes Nuevos:** `/home/imarthe/starters/reportes_auditoria_20260713_133352`  
**Directorio de Reportes Anteriores:** `/home/imarthe/starters/reportes_auditoria`  

---

## 📈 RESUMEN COMPARATIVO GLOBAL

Al ampliar los estándares de auditoría cognitiva y aplicar los escaneos locales de forma exhaustiva sobre cada proyecto individual, la cantidad de hallazgos identificados ha aumentado de manera notable. Esto se debe principalmente a un análisis más riguroso en la capa frontend (suscripciones huérfanas de Angular en todos los archivos `.ts`) y de mantenibilidad/rendimiento.

| Proyecto | Hallazgos Anteriores | Hallazgos Nuevos (Estándares Ampliados) | Diferencia | Estado / Tendencia |
| :--- | :---: | :---: | :---: | :--- |
| **ANGULAR21** | 1 | 8 | **+7** | 📈 Incremento por escaneo detallado de RxJS |
| **BACKEND-AGENDADOR** | 8 | 15 | **+7** | 📈 Nuevos smells y complejidad detectada |
| **BACKEND-BOVEDA-S3** | 8 | 8 | **0** | 🟢 Estable (mismos hallazgos de seguridad) |
| **BACKEND-ENVIO-CORREOS** | 4 | 4 | **0** | 🟢 Estable |
| **BACKEND-FOLIADOR** | 5 | 15 | **+10** | 📈 Incremento en smells de performance |
| **BACKEND-MICROSERVICIOS** | 4 | 4 | **0** | 🟢 Estable |
| **FRONT-SSE** | 2 | 9 | **+7** | 📈 Nuevos leaks de suscripción detectados |
| **FRONTEND-AGENDADOR** | 0 | 0 | **0** | 🟢 Sin hallazgos |
| **FRONTEND-ENVIO-CORREOS** | 1 | 10 | **+9** | 📈 Incremento por RxJS |
| **FRONTEND-FOLIADOR** | 1 | 18 | **+17** | 📈 Múltiples componentes con RxJS sin liberar |
| **FRONTEND-HOMOLOGADO** | 2 | 35 | **+33** | 📈 Gran volumen de fugas potenciales |
| **STARTER-ANGULAR-AUTHENTIK** | 1 | 54 | **+53** | 📈 Mayor número de suscripciones RxJS sin liberar |
| **STARTER-JAVA-AUTHENTIK** | 4 | 11 | **+7** | 📈 Nuevos smells de rendimiento/JPA |
| **WIKI-DOCS** | 0 | 0 | **0** | 🟢 Sin hallazgos |
| **TOTAL** | **41** | **191** | **+150** | 📈 **Aumento de Cobertura de Auditoría** |

---

## 🔍 ANÁLISIS DE LA DIFERENCIA (+150 Hallazgos)

1. **Escaneo exhaustivo en Frontend (Fugas de Memoria / RxJS):**
   - El nuevo estándar es mucho más riguroso buscando patrones de `.subscribe()` sin desuscripción en el ciclo de vida del componente Angular. Esto explica los incrementos sustanciales en **frontend-homologado (+33)** y **starter-angular-authentik (+53)**, donde anteriormente solo se reportaba un caso aislado y ahora se ha documentado cada ocurrencia en los archivos `.ts`.

2. **Detección de Complejidad Cognitiva y Code Smells:**
   - La inclusión de métricas de complejidad cognitiva en el estándar ampliado permitió identificar archivos con lógica altamente anidada (`if`, `for`, `catch` anidados) que incrementan la deuda técnica del proyecto.

3. **Performance en Bases de Datos y Persistencia:**
   - Los starters del backend ahora registran observaciones específicas sobre la falta de configuración de procesamiento por lotes (*batching*) y el riesgo potencial de consultas recursivas **N+1**.

---

## 🛠️ RECOMENDACIONES DE MITIGACIÓN PRIORITARIAS

1. **Remediar los Secretos Expuestos (Prioridad Crítica - P1):**
   - Sigue siendo la prioridad número uno eliminar el token expuesto en [starters.py](file:///home/imarthe/starters/starters.py#L7) y las claves de propiedades de base de datos y JWT en todos los archivos `application.properties`.
2. **Implementar Patrón de Desuscripción en Angular (Prioridad Alta - P2):**
   - Aplicar de manera masiva el operador `takeUntil(destroy$)` con un `Subject` en el hook `ngOnDestroy` en todos los componentes de frontend reportados para mitigar la fuga de memoria de manera definitiva.
3. **Calibrar Conexiones y Batching (Prioridad Media - P3):**
   - Configurar `spring.jpa.properties.hibernate.jdbc.batch_size=20` en los backends para optimizar las inserciones en lote.
