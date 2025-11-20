from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# --- Validadores ---
rut_validator = RegexValidator(
    regex=r'^[0-9]+-[0-9kK]{1}$',
    message="El RUT debe tener el formato 12345678-9 o 12345678-K"
)

class Cargo(models.Model):
    id_cargo = models.AutoField(primary_key=True)
    nombre_cargo = models.CharField(max_length=50)
    horas_trabajar = models.FloatField()
    #createdat = models.DateTimeField(auto_now_add=True)
    #updatedat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Cargos'

    def __str__(self):
        return self.nombre_cargo


def get_current_chile_time():
    """Obtiene la hora actual en zona horaria de Chile"""
    import pytz
    chile_tz = pytz.timezone('America/Santiago')
    return timezone.now().astimezone(chile_tz)

class ChileTimeModelMixin(models.Model):
    """Mixin para asegurar que los timestamps se guarden en hora chilena"""
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Override del método save para asegurar hora chilena en updatedAt"""
        # Si el modelo tiene campo updatedAt, actualizarlo con hora actual
        # Django ya maneja la configuración TIME_ZONE = 'America/Santiago' del settings.py
        if hasattr(self, 'updatedAt'):
            self.updatedAt = timezone.now()
        
        super().save(*args, **kwargs)

class Rol(ChileTimeModelMixin):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100)
    createdAt = models.DateTimeField(default=get_current_chile_time)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Rols'

    def __str__(self):
        return self.nombre_rol


class Totem(ChileTimeModelMixin):
    id_totem = models.AutoField(primary_key=True)
    ubicacion = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    createdAt = models.DateTimeField(default=get_current_chile_time)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Totems'

    def __str__(self):
        return self.ubicacion


""" class Usuario(models.Model):
    rut_usuario = models.CharField(
        max_length=12,
        unique=True,
        primary_key=True,
        validators=[rut_validator]
    )
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    password = models.CharField(max_length=128)
    horas_atrabajar = models.FloatField()
    pin = models.CharField(max_length=10, blank=True, null=True)
    intentos_pin = models.IntegerField(default=0)
    bloqueado_hasta = models.DateTimeField(blank=True, null=True)
    id_rol = models.ForeignKey('Rol', on_delete=models.CASCADE)
    id_cargo = models.ForeignKey('Cargo', on_delete=models.CASCADE)

    class Meta:
        db_table = 'Usuarios'


    def __str__(self):
        return f"{self.nombres} {self.apellidos}" """
    

class Usuario(AbstractUser):
    rut_usuario = models.CharField( 
        max_length=30,
        unique=True,
        validators=[rut_validator]
    )
    horas_atrabajar = models.FloatField(default=0.0) 
    pin = models.CharField(max_length=10, blank=True, null=True)
    intentos_pin = models.IntegerField(default=0, blank=True, null=True)
    bloqueado_hasta = models.DateTimeField(blank=True, null=True)
    foto_url = models.URLField(max_length=500, blank=True, null=True)
    id_rol = models.ForeignKey('Rol', on_delete=models.CASCADE, null=True, db_column='id_rol')
    id_cargo = models.ForeignKey('Cargo', on_delete=models.CASCADE, null=True, db_column='id_cargo')

    USERNAME_FIELD = 'username' 
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    class Meta:
        db_table = 'Usuarios'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.rut_usuario})"
    
    first_name = models.CharField(max_length=150, blank=True, db_column='nombres')
    last_name = models.CharField(max_length=150, blank=True, db_column='apellidos')



class QR(models.Model):
    codigo_unico = models.CharField(max_length=500, unique=True)
    estado_qr = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=get_current_chile_time)
    rut_usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, db_column='rut_usuario', to_field='rut_usuario')
    #createdAt = models.DateTimeField(auto_now_add=True)
    #updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'QRs'


class Marcaje(ChileTimeModelMixin):
    id_marcaje = models.AutoField(primary_key=True)
    hora_ingreso = models.DateTimeField()
    hora_salida = models.DateTimeField(blank=True, null=True)
    fecha = models.DateField()
    observacion = models.TextField(blank=True, null=True)
    rut_usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, db_column='rut_usuario', to_field='rut_usuario')
    id_totem = models.ForeignKey('Totem', on_delete=models.CASCADE, db_column='id_totem')
    createdAt = models.DateTimeField(default=get_current_chile_time)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Marcajes'
    
    def save(self, *args, **kwargs):
        """
        Override del método save para aplicar zona horaria chilena
        """
        # Aplicar la lógica de hora chilena del mixin
        # Django ya maneja la configuración TIME_ZONE = 'America/Santiago' del settings.py
        if hasattr(self, 'updatedAt'):
            self.updatedAt = timezone.now()
        
        # Guardar el marcaje
        super(ChileTimeModelMixin, self).save(*args, **kwargs)
    



class Registro_marcaje(models.Model):
    rut_usuario = models.CharField(
        max_length=30,  
        validators=[rut_validator],
        db_column='rut_usuario'
    )
    id_marcaje = models.ForeignKey('Marcaje', on_delete=models.CASCADE, db_column='id_marcaje')
    id_totem = models.ForeignKey('Totem', on_delete=models.CASCADE, db_column='id_totem')
    fecha_registro = models.DateTimeField(default=get_current_chile_time)

    class Meta:
        db_table = 'RegistroMarcaje'
        
        
    def clean(self):
        from django.core.exceptions import ValidationError
        try:
            Usuario.objects.get(rut_usuario=self.rut_usuario)
        except Usuario.DoesNotExist:
            raise ValidationError({'rut_usuario': 'Usuario con este RUT no existe.'})



class Justificacion(models.Model):
    id_justificacion = models.AutoField(primary_key=True)

    rut_usuario = models.ForeignKey(
        'Usuario',
        on_delete=models.CASCADE,
        db_column='rut_usuario',
        to_field='rut_usuario'
    )

    fecha_justificacion = models.DateField()

    motivo = models.CharField(
        max_length=100
        # Ejemplos: 'congreso', 'charla', 'enfermedad', 'personal', 'otro'
    )

    descripcion = models.TextField(blank=True, null=True)

    es_justificada = models.BooleanField(
        default=False
        # true = suma 8 horas (congreso, charla, enfermedad)
        # false = no suma horas (personal, otro)
    )

    horas_compensadas = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
        # 8.00 si es justificada, 0 si no lo es
    )

    estado = models.CharField(
        max_length=50,
        default='REGISTRADA'
        # Único estado por ahora
    )

    observaciones = models.TextField(blank=True, null=True)

    fecha_registro = models.DateTimeField(default=get_current_chile_time)

    class Meta:
        db_table = 'Justificacions'

    def __str__(self):
        return f"Justificación {self.id_justificacion} - {self.rut_usuario}"
    

class Notificacion(models.Model):
    id_alerta = models.AutoField(primary_key=True)

    aviso = models.CharField(max_length=255)

    descripcion = models.CharField(
        max_length=500
    )



    class Meta:
        db_table = 'Notificacions'

    def __str__(self):
        return f"Alerta {self.id_alerta}: {self.aviso}"


""" class Motivo(models.Model):
    id_motivo = models.AutoField(primary_key=True)

    descripcion = models.CharField(
        max_length=255
    )

    periodo = models.TimeField()

    observaciones = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    id_justificacion = models.ForeignKey('Justificacion', on_delete=models.CASCADE, db_column='id_justificacion')

    class Meta:
        db_table = 'Motivos'

    def __str__(self):
        return f"Motivo {self.id_motivo} - {self.descripcion}" """
