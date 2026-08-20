from django.urls import include, re_path
from django.views.decorators.csrf import csrf_exempt
from tcms.urls import urlpatterns as original_patterns
from social_django.views import complete as social_complete

# Vista OIDC callback con CSRF exempt
@csrf_exempt
def oidc_complete(request, backend):
    return social_complete(request, backend)

# Patrones de URL con OIDC callback CSRF exempt
urlpatterns = [
    # Callback OIDC con CSRF desactivado
    re_path(r'^accounts/complete/(?P<backend>oidc)/$', oidc_complete, name='oidc-complete'),
    # Resto de URLs de social_django
    re_path(r'^accounts/', include('social_django.urls', namespace='social')),
] + original_patterns
