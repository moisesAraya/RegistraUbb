from django.contrib import admin
from .models import Cargo, Rol, Totem, Usuario, QR, Marcaje, Asistencia, Justificacion, Notificacion

# Register your models here.
admin.site.register(Cargo)
admin.site.register(Rol)
admin.site.register(Totem)
admin.site.register(Usuario)
admin.site.register(QR)
admin.site.register(Marcaje)
# Registro_marcaje eliminado - la información está en la tabla Marcaje
admin.site.register(Asistencia)
admin.site.register(Justificacion)
admin.site.register(Notificacion)
