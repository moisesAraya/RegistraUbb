from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

class FaviconMiddleware(MiddlewareMixin):
    """
    Middleware para manejar favicon.ico sin autenticación
    """
    def process_request(self, request):
        if request.path == '/favicon.ico':
            # Retornar respuesta vacía sin pasar por autenticación
            return HttpResponse(status=204, content_type='image/x-icon')
        return None