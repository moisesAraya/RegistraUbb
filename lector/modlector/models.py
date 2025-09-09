from django.db import models
from django.core.validators import RegexValidator

# Create your models here.
class Cargo(models.Model):
    id_cargo = models.AutoField(primary_key=True)
    nombre_cargo = models.CharField(max_length=50)


class Cargo_usuario(models.Model):
    id_cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE)
    id_usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE)



rut_validator = RegexValidator(
    regex=r'^[0-9]+-[0-9kK]{1}$',
    message="El RUT debe tener el formato 12345678-9 o 12345678-K"
)

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100)


class QR(models.Model):
    codigo_unico = models.CharField(max_length=100, unique=True)
    estado_qr = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    rut_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)


class Usuario(models.Model):
    rut_usuario = models.CharField(max_length=12, 
                                   unique=True, 
                                   primary_key=True,
                                   validators=[rut_validator])
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    password = models.CharField(max_length=128)
    horas_atrabajar = models.FloatField()
    id_rol = models.ForeignKey('Rol', on_delete=models.CASCADE)

class Totem(models.Model):
    id_totem = models.AutoField(primary_key=True)
    ubicacion = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

class Marcaje(models.Model):
    id_marcaje = models.AutoField(primary_key=True)
    hora_ingreso = models.DateTimeField()
    hora_salida = models.DateTimeField(blank=True, null=True)
    fecha = models.DateField()
    observacion = models.TextField(blank=True, null=True)
    id_totem = models.ForeignKey('Totem', on_delete=models.CASCADE)


class Registro_marcaje(models.Model):
    rut_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    id_marcaje = models.ForeignKey(Marcaje, on_delete=models.CASCADE)
    id_totem = models.ForeignKey(Totem, on_delete=models.CASCADE)
    fecha_registro = models.DateTimeField(auto_now_add=True)


class Asistencia(models.Model):
    id_asist = models.AutoField(primary_key=True)
    colacion = models.BooleanField(default=False)
    observacion = models.TextField(blank=True, null=True)
    id_marcaje = models.ForeignKey(Marcaje, on_delete=models.CASCADE)
    id_just= models.ForeignKey('Justificacion', on_delete=models.CASCADE, blank=True, null=True)


class Notificacion(models.Model):
    id_alerta = models.AutoField(primary_key=True)
    aviso = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    id_asist = models.ForeignKey(Asistencia, on_delete=models.CASCADE)


class Justificacion(models.Model):
    id_just = models.AutoField(primary_key=True)
    descripcion = models.TextField()
    estado_just = models.BooleanField(default=False)


class Registro_just(models.Model):
    id_just = models.ForeignKey(Justificacion, on_delete=models.CASCADE)
    rut_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)    
    fecha_registro = models.DateTimeField(auto_now_add=True)


class Motivo(models.Model):
    id_motivo = models.AutoField(primary_key=True)
    descripcion = models.TextField()
    periodo = models.TimeField()
    observacion = models.TextField(blank=True, null=True)
    id_just = models.ForeignKey(Justificacion, on_delete=models.CASCADE)



