# configure_authentik.py
import sys
from authentik.flows.models import Flow
from authentik.core.models import Application

# Intentar importar proveedor OpenID Connect (Authentik 2024+)
try:
    from authentik.providers.oauth2.models import OAuth2Provider as OIDC_Provider
    use_oauth2_as_oidc = True
    print("ℹ Usando OAuth2Provider (compatible con OIDC)")
except ImportError:
    try:
        from authentik.providers.oauth2_provider.models import OAuth2Provider as OIDC_Provider
        use_oauth2_as_oidc = False
        print("ℹ Usando OAuth2Provider específico")
    except ImportError:
        print("✗ No se encontró proveedor OIDC/OAuth2")
        sys.exit(1)

from authentik.providers.oauth2.models import ScopeMapping, RedirectURI, RedirectURIMatchingMode

# Get implicit authorization flow
try:
    auth_flow = Flow.objects.get(slug="default-provider-authorization-implicit-consent")
except Flow.DoesNotExist:
    try:
        auth_flow = Flow.objects.get(slug="default-provider-authorization-explicit-consent")
    except Flow.DoesNotExist:
        auth_flow = Flow.objects.filter(slug__contains="authorization").first()

if not auth_flow:
    print("✗ No se encontró flow de autorización")
    sys.exit(1)

print(f"✓ Flow autorización: {auth_flow.slug}")

# Scopes necesarios para OIDC
scopes = list(ScopeMapping.objects.filter(scope_name__in=["openid", "email", "profile"]))
print(f"✓ Scopes disponibles: {len(scopes)}")

# Create or update Kiwi OIDC Provider
kiwi_provider, created = OIDC_Provider.objects.update_or_create(
    name="Kiwi TCMS",
    defaults={
        "client_id": "kiwi_client_id_2026",
        "client_secret": "kiwi_client_secret_super_secure_2026",
        "client_type": "confidential",
        "redirect_uris": [
            RedirectURI(
                matching_mode=RedirectURIMatchingMode.STRICT,
                url="https://kiwi.casmart.internal/accounts/complete/oidc/"
            )
        ],
        "authorization_flow": auth_flow,
        "include_claims_in_id_token": True,  # Incluir claims en ID token
        "access_token_validity": "minutes=5",
        "refresh_token_validity": "days=7",
    }
)

# Agregar scopes
if scopes:
    kiwi_provider.property_mappings.set(scopes)
    print(f"✓ Scopes asignados: {[s.scope_name for s in scopes]}")

print(f"{'✓ Nuevo' if created else '✓ Actualizado'} proveedor Kiwi TCMS OIDC")

# Create or update Kiwi Application
kiwi_app, created = Application.objects.update_or_create(
    slug="kiwi",
    defaults={
        "name": "Kiwi TCMS",
        "provider": kiwi_provider,
    }
)
print(f"Kiwi TCMS Application configured (created={created})")

# Create or update Plane Provider
plane_provider, created = OAuth2Provider.objects.update_or_create(
    name="Plane",
    defaults={
        "client_id": "plane_client_id_2026",
        "client_secret": "plane_client_secret_super_secure_2026",
        "client_type": "confidential",
        "redirect_uris": [
            RedirectURI(
                matching_mode=RedirectURIMatchingMode.STRICT,
                url="https://plane.casmart.internal/auth/openid/callback"
            )
        ],
        "authorization_flow": auth_flow,
    }
)
plane_provider.property_mappings.set(scopes)
print(f"Plane Provider configured (created={created})")

# Create or update Plane Application
plane_app, created = Application.objects.update_or_create(
    slug="plane",
    defaults={
        "name": "Plane",
        "provider": plane_provider,
    }
)
print(f"Plane Application configured (created={created})")
