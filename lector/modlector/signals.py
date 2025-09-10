from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Cargo
from django.db import connections, transaction

@receiver(post_save, sender=Cargo)
def create_cargo_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['postgres'].cursor() as cursor:
            cursor.execute("""
                INSERT INTO "Cargos" (id_cargo, nombre_cargo, horas_trabajar)
                VALUES (%s, %s, %s)
            """, [instance.id_cargo, instance.nombre_cargo, instance.horas_trabajar])
        transaction.commit(using='postgres')
        print(f'Cargo {instance.nombre_cargo} creado en la base de datos PostgreSQL.')
