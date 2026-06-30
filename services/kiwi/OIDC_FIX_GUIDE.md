# Guía de Solución: AuthStateMissing en Kiwi TCMS OIDC

## 🔴 Problema
**Error:** `AuthStateMissing` al intentar completar la autenticación OIDC  
**Síntoma:** Session value state missing en `/accounts/complete/oidc/`  
**Causa:** La cookie de sesión no se persistía correctamente entre el inicio del login y el callback del proveedor OIDC.

## ✅ Soluciones Aplicadas

### 1. **Sesiones en Base de Datos**
```python
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
```
- **Por qué:** Cada worker de uWSGI tiene su propio cache en memoria (locmem). 
- **Problema:** Worker A inicia el login, guarda state en su cache; Worker B recibe el callback pero no encuentra el state → AuthStateMissing
- **Solución:** Usar la BD PostgreSQL como almacén compartido de sesiones

### 2. **Configuración de Cookies Seguras**
```python
SESSION_COOKIE_SAMESITE = 'Lax'  # Más seguro que None
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_SAVE_EVERY_REQUEST = True
```
- **Por qué:** El navegador necesita enviar la cookie en el redirect de vuelta desde el proveedor OIDC
- **Lax vs None:** Lax es más seguro (restringe cookies en navegación cruzada) mientras permite GET desde links
- **HTTPONLY:** Previene XSS attacks
- **SAVE_EVERY_REQUEST:** Asegura que cada request actualiza la sesión en la BD

### 3. **CSRF Configuration**
```python
CSRF_USE_SESSIONS = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
```
- **Por qué:** El provider OIDC no puede generar un CSRF token válido
- **Solución:** Usar sesiones para almacenar CSRF token, y desactivar CSRF check para callback

### 4. **Desactivar CSRF para OIDC Callback**
En `custom_urls.py`:
```python
re_path(r'^complete/(?P<backend>[^/]+)/$', csrf_exempt(social_urls.complete), name='complete'),
```
- **Por qué:** El proveedor OIDC no envía CSRF token en el callback
- **Seguridad:** El token `state` de OIDC sirve como protección contra CSRF attacks

### 5. **Social-Auth Configuration**
```python
SOCIAL_AUTH_STATE_EXPIRATION_SECONDS = 600  # 10 minutos
SOCIAL_AUTH_SESSION_EXPIRATION = False  # No expirar state después del login
SOCIAL_AUTH_SANITIZE_REDIRECTS = False
```
- **STATE_EXPIRATION_SECONDS:** Evita ataques de replay, pero da tiempo suficiente para el flujo
- **SESSION_EXPIRATION:** Permite flujos OIDC lentos sin perder el state

### 6. **Proxy Configuration**
```python
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = ['https://kiwi.casmart.internal', 'https://kiwi-tcms:8443']
```
- **Por qué:** Caddy está actuando como reverse proxy y necesita pasar headers correctamente
- **Importancia:** Sin esto, Django puede rechazar requests del proxy

## 🚀 Pasos para Aplicar

### 1. Actualizar local_settings.py
✅ Ya actualizado con todas las configuraciones

### 2. Actualizar custom_urls.py
✅ Ya actualizado con `csrf_exempt` en el callback

### 3. Reiniciar servicios
```bash
docker-compose -f services/kiwi/docker-compose.yml restart
```

### 4. Verificar Base de Datos de Sesiones
```bash
docker-compose -f services/kiwi/docker-compose.yml exec kiwi python manage.py migrate
docker-compose -f services/kiwi/docker-compose.yml exec kiwi python manage.py shell
```
Luego en el shell:
```python
from django.contrib.sessions.models import Session
print(Session.objects.count())  # Debe haber 0 o más sesiones
```

## 🧪 Pruebas

### Test 1: Login OIDC
1. Ir a `https://kiwi.casmart.internal/accounts/login/`
2. Hacer click en "OIDC" (si está disponible)
3. Debería redirigir a Authentik
4. Hacer login en Authentik
5. Debería redirigir de vuelta a Kiwi y crear usuario

### Test 2: Verificar Sesiones en BD
```bash
docker-compose -f services/kiwi/docker-compose.yml exec -T db psql -U kiwi_user -d kiwi_db -c "SELECT COUNT(*) FROM django_session;"
```

### Test 3: Logs
```bash
docker-compose -f services/kiwi/docker-compose.yml logs kiwi
```
Buscar: "Kiwi TCMS Provider configured" o errores OIDC

## 🐛 Troubleshooting

### Aún aparece AuthStateMissing
1. ✅ Verificar que `SESSION_ENGINE` está en BD
2. ✅ Limpiar sesiones antiguas: `python manage.py clearsessions`
3. ✅ Verificar logs de BD: `SOCIAL_AUTH_RAISE_EXCEPTIONS = True` en settings
4. ✅ Verificar reloj sincronizado entre servidores

### Cookie no se envía
1. ✅ Verificar que `SECURE_PROXY_SSL_HEADER` está correcto
2. ✅ Verificar headers en request: `curl -v https://kiwi.casmart.internal`
3. ✅ Verificar que navegador acepta cookies (Devtools → Application → Cookies)

### CSRF Error después del fix
1. ✅ Verificar que `csrf_exempt` está en `complete` view
2. ✅ Verificar que `CSRF_USE_SESSIONS = True`
3. ✅ Borrar cache del navegador

## 📊 Configuración Resumen

| Configuración | Valor | Razón |
|---|---|---|
| `SESSION_ENGINE` | `django.contrib.sessions.backends.db` | Compartir entre workers |
| `SESSION_COOKIE_SAMESITE` | `Lax` | Seguridad + Cross-site compatible |
| `SESSION_SAVE_EVERY_REQUEST` | `True` | Asegurar persistencia |
| `CSRF_USE_SESSIONS` | `True` | CSRF desde sesión |
| `CSRF_EXEMPT` (complete) | `True` | No hay token OIDC |
| `SOCIAL_AUTH_STATE_EXPIRATION_SECONDS` | `600` | 10 min para flujo |
| `SOCIAL_AUTH_SESSION_EXPIRATION` | `False` | No expirar state rápido |

## 🔐 Seguridad

Este fix mantiene seguridad alta:
- ✅ CSRF protegido por token `state` de OIDC
- ✅ Sesiones en BD (no en caché vulnerable)
- ✅ Cookies HTTPONLY (no accesibles a JS)
- ✅ Cookies SECURE (solo por HTTPS)
- ✅ SAMESITE=Lax (restricción cross-site)

## 📚 Referencias

- [Django Sessions](https://docs.djangoproject.com/en/6.0/topics/http/sessions/)
- [OAuth2 State Parameter](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1)
- [OWASP CSRF](https://owasp.org/www-community/attacks/csrf)
- [Python Social Auth OIDC](https://python-social-auth.readthedocs.io/en/latest/backends/oidc.html)
