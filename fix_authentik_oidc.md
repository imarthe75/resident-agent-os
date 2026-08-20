# Solución: KeyError 'keys' en JWKS de Authentik

## 🔴 Problema

El endpoint JWKS de Authentik devuelve un JSON **vacío** `{}` en lugar de contener las claves públicas necesarias para validar tokens OIDC.

```
KeyError: 'keys'
  File: social_core/backends/open_id_connect.py:171
  return loads(response.text)["keys"]  # ← falla aquí
```

## 🔍 Causa Raíz

El proveedor OAuth2 en Authentik **no está generando JWKS** porque:
1. El proveedor puede no estar configurado como OpenID Connect
2. Falta configuración de signing keys
3. El proveedor está inactivo

## ✅ Solución

### Opción 1: Ejecutar Script de Configuración en Authentik

```bash
# Dentro del container Authentik
docker exec authentik python manage.py shell < /opt/prism/configure_authentik.py
```

O si tienes acceso SSH al servidor Authentik:

```bash
ssh user@auth.casmart.internal
cd /authentik
python manage.py shell < /opt/prism/configure_authentik.py
```

### Opción 2: Configurar Manualmente en UI de Authentik

1. Acceder a: `https://auth.casmart.internal:9443` (o admin panel)
2. Ir a: **Providers** → **OAuth2/OpenID**
3. Encontrar o crear: **Kiwi TCMS**
4. Configurar:
   - **Client Type**: Confidential
   - **Client ID**: `kiwi_client_id_2026`
   - **Client Secret**: `kiwi_client_secret_super_secure_2026`
   - **Redirect URI**: `https://kiwi.casmart.internal/accounts/complete/oidc/`
   - **Authorization Flow**: Default authorization explicit consent
   - **Property Mappings**: openid, email, profile
   - **Include Claims in ID Token**: ✓ Activado
   - **Status**: Active ✓

### Opción 3: Verificar JWKS Manualmente

```bash
# Dentro del container Kiwi
sudo docker compose -f services/kiwi/docker-compose.yml exec -T kiwi curl -sk \
  https://auth.casmart.internal/application/o/kiwi/jwks/ | python -m json.tool
```

**Esperado:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "...",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Actual:**
```json
{}
```

## 🔧 Cambios Realizados en Kiwi

### 1. Actualizado `configure_authentik.py`
- Agregar soporte para proveedor OpenID Connect explícito
- Configurar `include_claims_in_id_token = True`
- Mejorar manejo de flows

### 2. Actualizado `local_settings.py`
- Agregar `SOCIAL_AUTH_OIDC_QUERY_EMAIL = True`
- Mejorar compatibilidad

## 🚀 Pasos Siguientes

1. **Ejecutar configuración en Authentik**:
   ```bash
   docker exec authentik python manage.py shell < /opt/prism/configure_authentik.py
   ```

2. **Verificar JWKS**:
   ```bash
   curl -sk https://auth.casmart.internal/application/o/kiwi/jwks/ | jq .
   ```

3. **Reiniciar Kiwi**:
   ```bash
   sudo docker compose -f services/kiwi/docker-compose.yml restart kiwi
   ```

4. **Intentar login OIDC nuevamente**:
   - https://kiwi.casmart.internal/accounts/login/

## 📝 Notas

- El error `KeyError: 'keys'` solo ocurre cuando JWKS está vacío
- Esto es un problema de **Authentik**, no de Kiwi
- Una vez configurado correctamente en Authentik, Kiwi funcionará automáticamente
- El script `configure_authentik.py` se proporcionó para automatizar este proceso

## 🔗 Referencias

- [Python Social Auth OIDC Documentation](https://python-social-auth.readthedocs.io/en/latest/backends/oidc.html)
- [Authentik OAuth2 Provider Setup](https://goauthentik.io/docs/providers/oauth2/)
- [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html)
