"""
URL configuration for mysite project.
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
    return HttpResponse(
        b'\x00\x00\x01\x00\x01\x00\x10\x10\x00\x00\x01\x00\x08\x00h\x05\x00\x00\x16\x00\x00\x00(\x00\x00\x00\x10\x00\x00\x00 \x00\x00\x00\x01\x00\x08\x00\x00\x00\x00\x00@\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00',
        content_type='image/vnd.microsoft.icon'
    )

urlpatterns = [
    path('favicon.ico', favicon_view),
    path('admin/', admin.site.urls),

    # --- RUTAS CON PREFIJO LECTOR (CORREGIDAS) ---
    # Al agregar 'lector/' aquí, la redirección ahora será: .../lector/configuracion/
    path('lector/configuracion/', views.configuracion_totem_view, name='configuracion_totem'),
    path('lector/guardar_totem/', views.guardar_totem, name='guardar_totem'),
    
    # Esta ruta es la que usa el fetch de JavaScript
    path('lector/reconfigurar_totem/', views.reconfigurar_totem, name='reconfigurar_totem'),


    # --- RUTAS PRINCIPALES ---
    path('', views.lector_qr_view, name='lector_qr'),
    path('procesar_qr/', views.procesar_qr, name='procesar_qr'),
    path('verificar_pin/', views.verificar_pin, name='verificar_pin'),
    path('reset/', views.reset_session, name='reset_session'),
]

# Servir archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)