#!/usr/bin/env python
import sys
import traceback

print("\n" + "="*60)
print("🔧 CONFIGURANDO PLANE EN AUTHENTIK")
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
    for slug in [
        "default-provider-authorization-explicit-consent",
        "default-provider-authorization-implicit-consent",
    ]:
        try:
            auth_flow = Flow.objects.get(slug=slug)
            print(f"   ✓ Flow encontrado: {slug}")
            break
        except Flow.DoesNotExist:
            continue

    if not auth_flow:
        auth_flow = Flow.objects.filter(slug__contains="authorization").first()

    if not auth_flow:
        raise Exception("No se encontró flow de autorización")

    # 2. Obtener scopes
    print("\n2️⃣  Obteniendo scopes OIDC...")
    scopes = list(ScopeMapping.objects.filter(
        scope_name__in=["openid", "email", "profile"]
    ))
    print(f"   ✓ Scopes encontrados: {[s.scope_name for s in scopes]}")

    # 3. Crear/actualizar proveedor OAuth2
    print("\n3️⃣  Configurando proveedor OAuth2/OIDC para Plane...")
    
    # Limpiar conflictos previos
    for p in OAuth2Provider.objects.filter(name="Plane"):
        if p.client_id != "plane":
            print(f"   ℹ Eliminando proveedor con nombre 'Plane' pero diferente client_id ({p.client_id})")
            p.delete()
            
    for p in OAuth2Provider.objects.filter(client_id="plane"):
        if p.name != "Plane":
            print(f"   ℹ Eliminando proveedor con client_id 'plane' pero diferente nombre ({p.name})")
            p.delete()

    plane_provider, created = OAuth2Provider.objects.update_or_create(
        client_id="plane",
        defaults={
            "name": "Plane",
            "client_secret": "casmarts_secret_2026",
            "client_type": "confidential",
            "authorization_flow": auth_flow,
            "redirect_uris": [
                RedirectURI(
                    url=r"^https://plane\.casmart\.internal/.*",
                    matching_mode=RedirectURIMatchingMode.REGEX
                )
            ],
        }
    )

    action = "✓ CREADO" if created else "✓ ACTUALIZADO"
    print(f"   {action} proveedor: {plane_provider.name}")
    print(f"   ✓ Redirect URI REGEX: configurada")

    print("\n5️⃣  Asignando scopes...")
    plane_provider.property_mappings.set(scopes)
    plane_provider.save()

    # 6. Crear/actualizar aplicación
    print("\n6️⃣  Configurando aplicación Plane...")
    plane_app, created = Application.objects.update_or_create(
        slug="plane",
        defaults={
            "name": "Plane",
            "provider": plane_provider,
        }
    )

    action = "✓ CREADA" if created else "✓ ACTUALIZADA"
    print(f"   {action} aplicación: {plane_app.name}")

    print("\n✅ CONFIGURACIÓN COMPLETADA")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    traceback.print_exc()
    sys.exit(1)
