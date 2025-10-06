from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

class FaviconMiddleware(MiddlewareMixin):
    """
    Middleware para manejar favicon.ico sin autenticación
    Procesa la solicitud antes de que llegue a la autenticación
    """
    def process_request(self, request):
        if request.path_info == '/favicon.ico':
            # Retornar respuesta inmediata sin pasar por otros middlewares
            response = HttpResponse(
                b'\x00\x00\x01\x00\x01\x00\x10\x10\x00\x00\x01\x00\x08\x00h\x05\x00\x00\x16\x00\x00\x00',
                content_type='image/vnd.microsoft.icon'
            )
            response['Cache-Control'] = 'public, max-age=86400'
            response['Expires'] = 'Thu, 31 Dec 2099 23:59:59 GMT'
            return response
        return None