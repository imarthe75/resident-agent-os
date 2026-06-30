#!/usr/bin/env python
"""
Script mejorado para configurar Kiwi TCMS en Authentik.
Ejecutar: docker exec authentik-server python manage.py shell < configure_authentik_v2.py
"""
import sys
import traceback

print("\n" + "="*60)
print("🔧 CONFIGURANDO KIWI TCMS EN AUTHENTIK")
print("="*60 + "\n")

try:
    from authentik.flows.models import Flow
    from authentik.core.models import Application
    from authentik.providers.oauth2.models import (
        OAuth2Provider,
        ScopeMapping,
        RedirectURI,
        RedirectURIMatchingMode,
    )
    print("✓ Módulos importados correctamente")

    # 1. Buscar flow de autorización
    print("\n1️⃣  Buscando flow de autorización...")
    auth_flow = None

    # Intentar con slugs comunes
    for slug in [
        "default-provider-authorization-explicit-consent",
        "default-provider-authorization-implicit-consent",
        "default-provider-authorization-approval",
    ]:
        try:
            auth_flow = Flow.objects.get(slug=slug)
            print(f"   ✓ Flow encontrado: {slug}")
            break
        except Flow.DoesNotExist:
            continue

    if not auth_flow:
        auth_flow = Flow.objects.filter(slug__contains="authorization").first()
        if auth_flow:
            print(f"   ✓ Flow encontrado (búsqueda genérica): {auth_flow.slug}")

    if not auth_flow:
        print("   ✗ NO SE ENCONTRÓ FLOW")
        print("   Flows disponibles:")
        for flow in Flow.objects.all()[:10]:
            print(f"     - {flow.slug}")
        raise Exception("No se encontró flow de autorización")

    # 2. Obtener scopes
    print("\n2️⃣  Obteniendo scopes OIDC...")
    scopes = list(ScopeMapping.objects.filter(
        scope_name__in=["openid", "email", "profile"]
    ))
    print(f"   ✓ Scopes encontrados: {[s.scope_name for s in scopes]}")

    if not scopes:
        print("   ⚠ ADVERTENCIA: No hay scopes. Creando...")
        # Intentar crear scopes básicos
        for scope_name in ["openid", "email", "profile"]:
            scope, created = ScopeMapping.objects.get_or_create(
                scope_name=scope_name,
                defaults={"name": scope_name.title()}
            )
            if created:
                print(f"   ✓ Scope creado: {scope_name}")
            scopes.append(scope)

    # 3. Crear/actualizar proveedor OAuth2
    print("\n3️⃣  Configurando proveedor OAuth2/OIDC...")

    kiwi_provider, created = OAuth2Provider.objects.update_or_create(
        name="Kiwi TCMS",
        defaults={
            "client_id": "kiwi_client_id_2026",
            "client_secret": "kiwi_client_secret_super_secure_2026",
            "client_type": "confidential",
            "authorization_flow": auth_flow,
        }
    )

    action = "✓ CREADO" if created else "✓ ACTUALIZADO"
    print(f"   {action} proveedor: {kiwi_provider.name}")
    print(f"   - Client ID: {kiwi_provider.client_id}")
    print(f"   - Client Type: {kiwi_provider.client_type}")

    # 4. Configurar Redirect URIs
    print("\n4️⃣  Configurando Redirect URIs...")
    kiwi_provider.redirect_uris.all().delete()

    redirect_uri = RedirectURI.objects.create(
        provider=kiwi_provider,
        url="https://kiwi.casmart.internal/accounts/complete/oidc/",
        matching_mode=RedirectURIMatchingMode.STRICT
    )
    print(f"   ✓ Redirect URI: {redirect_uri.url}")

    # 5. Asignar scopes
    print("\n5️⃣  Asignando scopes...")
    kiwi_provider.property_mappings.set(scopes)
    print(f"   ✓ Scopes asignados: {[s.scope_name for s in scopes]}")

    # 6. Configuración adicional
    print("\n6️⃣  Configuración avanzada...")
    kiwi_provider.save()
    print(f"   ✓ Proveedor guardado")

    # 7. Crear/actualizar aplicación
    print("\n7️⃣  Configurando aplicación...")
    kiwi_app, created = Application.objects.update_or_create(
        slug="kiwi",
        defaults={
            "name": "Kiwi TCMS",
            "provider": kiwi_provider,
        }
    )

    action = "✓ CREADA" if created else "✓ ACTUALIZADA"
    print(f"   {action} aplicación: {kiwi_app.name}")

    # 8. Verificar JWKS
    print("\n8️⃣  Verificando JWKS...")
    try:
        from django.core.cache import cache
        from authentik.providers.oauth2.views.jwks import jwks_keys

        # Intentar obtener JWKS
        jwks_data = cache.get(f"authentik_oauth2_jwks_{kiwi_provider.pk}")
        print(f"   ℹ Cache JWKS: {jwks_data}")
    except Exception as e:
        print(f"   ⚠ No se pudo verificar JWKS: {e}")

    print("\n" + "="*60)
    print("✅ CONFIGURACIÓN COMPLETADA")
    print("="*60)
    print("\nVerificar con:")
    print("  curl -sk https://auth.casmart.internal/application/o/kiwi/jwks/ | jq .")
    print("\nSi JWKS sigue vacío, reiniciar Authentik:")
    print("  docker-compose restart authentik-server\n")

except Exception as e:
    print("\n" + "="*60)
    print(f"❌ ERROR: {e}")
    print("="*60)
    traceback.print_exc()
    sys.exit(1)
