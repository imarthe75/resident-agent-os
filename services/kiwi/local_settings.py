# local_settings.py for Kiwi TCMS
import os
import copy
from tcms.settings.common import INSTALLED_APPS, TEMPLATES

AUTHENTICATION_BACKENDS = (
    'social_core.backends.open_id_connect.OpenIdConnectAuth',
    'django.contrib.auth.backends.ModelBackend',
)

DEBUG = True

SOCIAL_AUTH_OIDC_KEY = os.environ.get('SOCIAL_AUTH_OIDC_KEY', 'PLACEHOLDER_CLIENT_ID')
SOCIAL_AUTH_OIDC_SECRET = os.environ.get('SOCIAL_AUTH_OIDC_SECRET', 'PLACEHOLDER_CLIENT_SECRET')
SOCIAL_AUTH_OIDC_OIDC_ENDPOINT = 'https://auth.casmart.internal/application/o/kiwi/'
SOCIAL_AUTH_OIDC_VERIFY_SSL = False
# Forzar redirect_uri público para que Authentik lo acepte
SOCIAL_AUTH_OIDC_REDIRECT_URI = 'https://kiwi.casmart.internal/accounts/complete/oidc/'

# Configuración avanzada de OIDC
# Usar el JWKS URI de forma explícita para mayor compatibilidad
SOCIAL_AUTH_OIDC_PUBLIC_URL = 'https://kiwi.casmart.internal/accounts/complete/oidc/'
# Desactivar validación de estado del audience (por compatibilidad con algunos OIDC)
SOCIAL_AUTH_OIDC_QUERY_EMAIL = True  # Obtener email del userinfo endpoint

# -----------------------------------------------------------------------
# SESSION & STATE MANAGEMENT FIX
# -----------------------------------------------------------------------
# Usar base de datos para sesiones (compartidas entre workers uWSGI)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 horas
SESSION_SAVE_EVERY_REQUEST = True  # Guardar sesión en cada request

# Usar Lax en lugar de None para mejor seguridad y compatibilidad cross-browser
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True

# Social-auth: usar sesión para almacenar state (no caché)
SOCIAL_AUTH_STATE_EXPIRATION_SECONDS = 600
SOCIAL_AUTH_SESSION_EXPIRATION = False
SOCIAL_AUTH_SANITIZE_REDIRECTS = False

# Habilitar login by URL (necesario para OIDC)
SOCIAL_AUTH_URL_NAMESPACE = 'social'
SOCIAL_AUTH_RAISE_EXCEPTIONS = False
SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/'
SOCIAL_AUTH_LOGIN_ERROR_URL = '/accounts/login/'
# -----------------------------------------------------------------------

# CSRF CONFIGURATION
# -----------------------------------------------------------------------
# Confiar en el proxy y permitir OIDC callback
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = [
    'https://kiwi.casmart.internal',
    'https://kiwi-tcms:8443',
]

# CSRF debe confiar en sesiones para OIDC (no cookies CSRF separadas)
CSRF_USE_SESSIONS = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
# -----------------------------------------------------------------------

INSTALLED_APPS = list(INSTALLED_APPS) + ['social_django']

# Configure template override
TEMPLATES = copy.deepcopy(TEMPLATES)
TEMPLATES[0]['DIRS'].insert(0, '/venv/lib/python3.12/site-packages/tcms/templates/custom/')

# Redirect ROOT_URLCONF to custom module
ROOT_URLCONF = 'tcms.settings.custom_urls'
