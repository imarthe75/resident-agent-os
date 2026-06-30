#!/bin/bash

echo "🔍 Diagnóstico OIDC - Authentik"
echo "=================================="
echo ""

# Funciones
check_endpoint() {
    local url=$1
    local name=$2
    echo -n "Verificando $name... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -k "$url")
    if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
        echo "✓ OK (HTTP $status)"
        return 0
    else
        echo "✗ FALLO (HTTP $status)"
        return 1
    fi
}

# Verificar endpoints de Authentik
echo "1. ENDPOINTS DE AUTHENTIK"
check_endpoint "https://auth.casmart.internal/" "Base URL"
check_endpoint "https://auth.casmart.internal/application/o/kiwi/.well-known/openid-configuration" "OpenID Configuration"
check_endpoint "https://auth.casmart.internal/application/o/kiwi/jwks/" "JWKS Endpoint"

echo ""
echo "2. CONTENIDO DEL JWKS"
jwks=$(curl -s -k "https://auth.casmart.internal/application/o/kiwi/jwks/")
echo "Respuesta JWKS: $jwks"

if echo "$jwks" | grep -q '"keys"'; then
    echo "✓ JWKS contiene 'keys'"
else
    echo "✗ JWKS NO contiene 'keys' (PROBLEMA)"
    echo "  Necesita: ejecutar configure_authentik.py en Authentik"
fi

echo ""
echo "3. VERIFICAR PROVEEDOR EN AUTHENTIK"
echo ""
echo "Si tienes acceso a Authentik (http://auth.casmart.internal:9443):"
echo "  1. Ir a: Providers → OAuth2/OpenID"
echo "  2. Buscar: 'Kiwi TCMS'"
echo "  3. Verificar que el proveedor esté en estado 'Activo'"
echo "  4. Verificar que esté configurado como 'OpenID Connect' (no solo OAuth2)"
echo ""

echo "4. EJECUTAR CONFIGURACIÓN EN AUTHENTIK"
echo ""
echo "Opción 1 (Desde Authentik container):"
echo "  docker exec authentik python manage.py shell < configure_authentik.py"
echo ""
echo "Opción 2 (Via SSH/Admin):"
echo "  - SSH a servidor Authentik"
echo "  - Ejecutar: cd /authentik && python manage.py shell < configure_authentik.py"
echo ""

echo "5. DESPUÉS DE CONFIGURAR"
echo ""
echo "Verificar nuevamente con:"
echo "  curl -s -k https://auth.casmart.internal/application/o/kiwi/jwks/ | jq ."
echo ""
echo "Debería devolver:"
echo '  {'
echo '    "keys": ['
echo '      {"kty": "RSA", "use": "sig", ...},'
echo '      ...'
echo '    ]'
echo '  }'
echo ""
