"""
URL configuration for mysite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from modlector import views

@csrf_exempt
@never_cache
def favicon_view(request):
    """Vista simple para manejar favicon.ico sin autenticación"""
    # Crear un favicon transparente de 1x1 pixel
    favicon_data = (
        b'\x00\x00\x01\x00\x01\x00\x01\x01\x00\x00\x01\x00\x01\x00(\x00\x00\x00'
        b'\x16\x00\x00\x00(\x00\x00\x00\x01\x00\x00\x00\x02\x00\x00\x00\x01\x00'
        b'\x01\x00\x00\x00\x00\x00\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
        b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff'
        b'\xff\x00\x00\x00\x00\x00'
    )
    response = HttpResponse(favicon_data, content_type='image/x-icon')
    response['Cache-Control'] = 'max-age=86400'  # Cache por 1 día
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('hello/', views.index),
    path('api/usuarios/', views.listar_usuarios, name='listar_usuarios'),
    path('favicon.ico', favicon_view),  # Manejar favicon
]

# Servir archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
