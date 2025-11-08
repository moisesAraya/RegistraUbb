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
from django.views.decorators.http import require_http_methods
from modlector import views

@csrf_exempt
@never_cache
@require_http_methods(["GET", "HEAD"])
def favicon_view(request):
    """Vista para manejar favicon.ico sin autenticación"""
    # Retornar un favicon transparente simple
    return HttpResponse(
        b'\x00\x00\x01\x00\x01\x00\x10\x10\x00\x00\x01\x00\x08\x00h\x05\x00\x00\x16\x00\x00\x00(\x00\x00\x00\x10\x00\x00\x00 \x00\x00\x00\x01\x00\x08\x00\x00\x00\x00\x00@\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00',
        content_type='image/vnd.microsoft.icon'
    )

urlpatterns = [
    path('favicon.ico', favicon_view),  
    path('admin/', admin.site.urls),
    path('configuracion/', views.configuracion_totem_view, name='configuracion_totem'),
    path('guardar_totem/', views.guardar_totem, name='guardar_totem'),
    path('reconfigurar_totem/', views.reconfigurar_totem, name='reconfigurar_totem'),
    path('', views.lector_qr_view, name='lector_qr'),
    path('procesar_qr/', views.procesar_qr, name='procesar_qr'),
    path('verificar_pin/', views.verificar_pin, name='verificar_pin'),
    path('reset/', views.reset_session, name='reset_session'),
    
    
]

# Servir archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
