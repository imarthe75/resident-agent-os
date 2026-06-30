#!/bin/bash
set -e

echo "🔍 Verificando configuración OIDC y sesiones en Kiwi TCMS..."

# Esperar a que la BD esté disponible
echo "⏳ Esperando conexión a la BD..."
sleep 5

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones de Django..."
python /venv/bin/python manage.py migrate

# Limpiar sesiones expiradas
echo "🧹 Limpiando sesiones expiradas..."
python /venv/bin/python manage.py clearsessions

# Crear tabla de sesiones si no existe
echo "✅ Verificando tabla django_session..."
python /venv/bin/python manage.py shell -c "
from django.contrib.sessions.models import Session
print(f'✓ Tabla de sesiones disponible. Sesiones activas: {Session.objects.count()}')
"

# Verificar configuración OIDC
echo "✅ Verificando configuración OIDC..."
python /venv/bin/python manage.py shell -c "
from django.conf import settings
print(f'✓ SOCIAL_AUTH_OIDC_KEY: {settings.SOCIAL_AUTH_OIDC_KEY[:20]}...')
print(f'✓ SOCIAL_AUTH_OIDC_OIDC_ENDPOINT: {settings.SOCIAL_AUTH_OIDC_OIDC_ENDPOINT}')
print(f'✓ SESSION_ENGINE: {settings.SESSION_ENGINE}')
print(f'✓ SESSION_COOKIE_SAMESITE: {settings.SESSION_COOKIE_SAMESITE}')
print(f'✓ CSRF_USE_SESSIONS: {settings.CSRF_USE_SESSIONS}')
"

echo "✨ Configuración OIDC verificada correctamente!"
