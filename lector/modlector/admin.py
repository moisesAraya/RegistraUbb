from django.contrib import admin
from .models import Cargo, Rol, Totem, Usuario, QR, Marcaje, Registro_marcaje, Asistencia, Justificacion, Notificacion

# Register your models here.
admin.site.register(Cargo)
admin.site.register(Rol)
admin.site.register(Totem)
admin.site.register(Usuario)
admin.site.register(QR)
admin.site.register(Marcaje)
admin.site.register(Registro_marcaje)
admin.site.register(Asistencia)
admin.site.register(Justificacion)
admin.site.register(Notificacion)
