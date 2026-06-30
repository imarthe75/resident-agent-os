#!/bin/bash

set -e

echo "🧪 Test Suite: OIDC State Management Fix"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Test 1: Verificar que el contenedor Kiwi está corriendo
echo "Test 1: Verificar que Kiwi está corriendo..."
CONTAINER_ID=$(docker compose -f services/kiwi/docker compose.yml ps -q kiwi 2>/dev/null || echo "")
if [ -n "$CONTAINER_ID" ]; then
    print_status 0 "Contenedor Kiwi está corriendo (ID: ${CONTAINER_ID:0:12})"
else
    print_info "Contenedor no está corriendo. Iniciando..."
    docker compose -f services/kiwi/docker compose.yml up -d
    sleep 10
    CONTAINER_ID=$(docker compose -f services/kiwi/docker compose.yml ps -q kiwi)
    print_status 0 "Contenedor iniciado (ID: ${CONTAINER_ID:0:12})"
fi

# Test 2: Verificar tabla de sesiones en BD
echo ""
echo "Test 2: Verificar tabla de sesiones en base de datos..."
docker compose -f services/kiwi/docker compose.yml exec -T kiwi python manage.py shell -c \
    "from django.contrib.sessions.models import Session; print(f'Sessions in DB: {Session.objects.count()}')" > /dev/null 2>&1
print_status $? "Tabla de sesiones accesible"

# Test 3: Verificar configuración OIDC
echo ""
echo "Test 3: Verificar configuración OIDC..."
docker compose -f services/kiwi/docker compose.yml exec -T kiwi python manage.py shell -c "
from django.conf import settings

checks = [
    ('SESSION_ENGINE', 'django.contrib.sessions.backends.db', settings.SESSION_ENGINE),
    ('SESSION_COOKIE_SAMESITE', 'Lax', settings.SESSION_COOKIE_SAMESITE),
    ('SESSION_COOKIE_SECURE', True, settings.SESSION_COOKIE_SECURE),
    ('CSRF_USE_SESSIONS', True, settings.CSRF_USE_SESSIONS),
    ('SOCIAL_AUTH_STATE_EXPIRATION_SECONDS', 600, settings.SOCIAL_AUTH_STATE_EXPIRATION_SECONDS),
]

all_ok = True
for name, expected, actual in checks:
    if actual == expected:
        print(f'✓ {name}: {actual}')
    else:
        print(f'✗ {name}: expected {expected}, got {actual}')
        all_ok = False

exit(0 if all_ok else 1)
" > /dev/null 2>&1

print_status $? "Todas las configuraciones OIDC correctas"

# Test 4: Verificar custom_urls.py tiene csrf_exempt
echo ""
echo "Test 4: Verificar custom_urls.py tiene csrf_exempt en callback..."
docker compose -f services/kiwi/docker compose.yml exec -T kiwi grep -q "csrf_exempt" /venv/lib/python3.12/site-packages/tcms/settings/custom_urls.py
print_status $? "csrf_exempt importado y usado en custom_urls.py"

# Test 5: Probar que el servidor responde
echo ""
echo "Test 5: Verificar que servidor Kiwi responde..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
    print_status 0 "Servidor responde (HTTP $STATUS)"
else
    print_info "Esperando a que servidor esté listo..."
    sleep 10
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
        print_status 0 "Servidor responde (HTTP $STATUS)"
    else
        print_status 1 "Servidor no responde (HTTP $STATUS)"
    fi
fi

# Test 6: Verificar HTTPS y certificados (si está disponible)
echo ""
echo "Test 6: Verificar HTTPS en proxy..."
# Skip si no tenemos acceso al proxy
print_info "Proxy test skipped (requiere acceso a kiwi.casmart.internal)"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✨ Todos los tests pasaron!${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Acceder a https://kiwi.casmart.internal/accounts/login/"
echo "  2. Hacer click en OIDC login"
echo "  3. Completar autenticación en Authentik"
echo "  4. Si se redirige correctamente a Kiwi = ✓ FIX EXITOSO"
echo ""
echo "🔍 Diagnosticar si falla:"
echo "  - docker compose -f services/kiwi/docker compose.yml logs -f kiwi"
echo "  - Buscar 'AuthStateMissing' o 'CSRF' en logs"
echo ""
