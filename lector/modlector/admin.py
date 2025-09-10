from django.contrib import admin
from .models import Cargo, Rol, Totem, Usuario, Cargo_usuario, QR, Marcaje, Registro_marcaje, Justificacion, Asistencia, Notificacion, Registro_just

# Register your models here.
admin.site.register(Cargo)
admin.site.register(Rol)
admin.site.register(Totem)
admin.site.register(Usuario)
admin.site.register(Cargo_usuario)
admin.site.register(QR)
admin.site.register(Marcaje)
admin.site.register(Registro_marcaje)
admin.site.register(Justificacion)
admin.site.register(Asistencia)
admin.site.register(Notificacion)
admin.site.register(Registro_just)

