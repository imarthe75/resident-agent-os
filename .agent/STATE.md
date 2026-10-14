# 📈 Estado y Bitácora del Agente Residente (STATE.md)

Este documento es el diario de vida y bitácora del agente. Debe ser leído en el **Rito de Inicio** y actualizado en el **Rito de Cierre**.

## 🔄 Rito de Inicio (Bootstrapping)
*Cada vez que inicies sesión o seas llamado, ejecuta estos pasos:*
1. Lee tu leyes en `.agent/AGENT.md`.
2. Lee tu propósito en `.agent/CONTEXT.md`.
3. Revisa la lista de pendientes de la última sesión en la sección **"Próximos Pasos"** de este archivo.
4. Revisa que los servicios comunes (`casmarts-core-cache`, `casmarts-core-storage`) estén saludables.

---

## 📅 Bitácora de Sesión Actual

### 🔑 Estado del Agente:
- **Última Conexión:** 2026-06-30
- **Estado Cognitivo:** Operacional - Integración Satélites Completa (Sin Docling Local) ✅
- **Proyectos Gobernados:** `resident-agent-os`, `consulta-smart`, `lexivault-ai`, `idp-smart`

### 🛠️ Tareas Completadas hoy:
- [x] Configuración centralizada de servicios en la raíz (`docker-compose.yml` para cache, storage y dashboard). Se excluyó Docling local para usar NVIDIA NIM en su lugar.
- [x] Vinculación de `consulta-smart` a la base de datos externa (`10.4.3.23`) y Authentik/Vault (`10.4.3.208`).
- [x] Vinculación de `lexivault-ai` a la base de datos externa (`10.4.3.23`) y Authentik/Vault (`10.4.3.208`).
- [x] Vinculación de `idp-smart` a la base de datos externa (`10.4.3.23`) y Authentik/Vault (`10.4.3.208`).
- [x] Conceptualización del contexto cognitivo (`CONTEXT.md`, `MAP.md` y `STATE.md`) para gobernanza unificada.

### 🚨 Lecciones Aprendidas:
- *El uso de extra_hosts en los contenedores docker permite la resolución DNS de servidores centrales sin intervenir la configuración del host.*
- *La exclusión de servicios pesados locales (como docling local) optimiza el uso de CPU/RAM del host y facilita el uso de APIs externas de alto rendimiento como NVIDIA NIM.*

### 🚀 Próximos Pasos:
- [ ] Inicializar y ejecutar todos los servicios con la nueva configuración.
- [ ] Validar conectividad de cada servicio satélite a la base de datos y al administrador de secretos Vault.

### 📉 Cierre de sesión: desviación, causa, acción
*Se llena en el Rito de Cierre, por una persona. El agente propone, no inventa la causa.*
- **Desviación** (qué se esperaba y qué pasó realmente): _pendiente_
- **Causa** (por qué; si no se sabe, escribir «no determinada»): _pendiente_
- **Acción** (qué se hará distinto, quién y cuándo): _pendiente_
- **Costo de modelo de la sesión:** lo registra el resumen automático (`usage_totals`) con el costo que reportaron los skills.
