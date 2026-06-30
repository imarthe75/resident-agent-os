from django.urls import include, re_path
from django.views.decorators.csrf import csrf_exempt
from tcms.urls import urlpatterns as original_patterns

# Importar vistas de social_django
from social_django import urls as social_urls

# Crear versión con CSRF exempt para el callback OIDC
social_patterns = [
    re_path(r'^complete/(?P<backend>[^/]+)/$', csrf_exempt(social_urls.complete), name='complete'),
    re_path(r'^disconnect/(?P<backend>[^/]+)/$', social_urls.disconnect, name='disconnect'),
    re_path(r'^disconnect/(?P<backend>[^/]+)/(?P<association_id>\d+)/$', social_urls.disconnect, name='disconnect_individual'),
    re_path(r'^login/(?P<backend>[^/]+)/$', social_urls.begin, name='begin'),
]

urlpatterns = [
    re_path(r'^accounts/', include((social_patterns, 'social'), namespace='social')),
] + original_patterns
