from django.db import models

# Create your models here.
class Cargo(models.Model):
    nombre_cargo = models.CharField(max_length=50)

class Usuario(models.Model):
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    horas_atrabajar = models.FloatField()
    cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE, default=1)