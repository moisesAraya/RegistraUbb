from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Cargo, Rol, Totem, Usuario, Justificacion, Registro_just, Notificacion, Asistencia, Marcaje, Registro_marcaje, QR, Motivo
from django.db import connections, transaction
from django.utils import timezone

@receiver(post_save, sender=Cargo)
def create_cargo_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            now = timezone.now()
            cursor.execute("""
                INSERT INTO "Cargos" (id_cargo, nombre_cargo, horas_trabajar, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s)
            """, [instance.id_cargo, instance.nombre_cargo, instance.horas_trabajar, now, now])
        print(f'Cargo {instance.nombre_cargo} creado en la base de datos PostgreSQL.')



@receiver(post_save, sender=Rol)
def sync_rol_to_postgres(sender, instance, **kwargs):
    now = timezone.now()
    with connections['default'].cursor() as cursor:
        cursor.execute("""
            INSERT INTO "Rols" (id_rol, nombre_rol, createdat, updatedat)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id_rol)
            DO UPDATE SET 
                nombre_rol = EXCLUDED.nombre_rol,
                updatedat = EXCLUDED.updatedat
        """, [instance.id_rol, instance.nombre_rol, now, now])
    print(f'[SYNC] Rol {instance.id_rol} sincronizado en PostgreSQL.')



@receiver(post_save, sender=Totem)
def create_totem_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            now = timezone.now()
            cursor.execute("""
                INSERT INTO "Totems" (id_totem, ubicacion, descripcion, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s)
            """, [instance.id_totem, instance.ubicacion, instance.descripcion, now, now])
        print(f'Totem {instance.ubicacion} creado en la base de datos PostgreSQL.')

@receiver(post_save, sender=Usuario)
def create_usuario_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                INSERT INTO "Usuarios" (rut_usuario, nombres, apellidos, email, password, horas_atrabajar, id_rol, id_cargo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, [instance.rut_usuario, instance.nombres, instance.apellidos, instance.email, instance.password, instance.horas_atrabajar, instance.id_rol, instance.id_cargo])
        print(f'Usuario {instance.nombres} {instance.apellidos} creado en la base de datos PostgreSQL.')

@receiver(post_save, sender=Justificacion)
def create_justificacion_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            now = timezone.now()
            cursor.execute("""
                INSERT INTO "Justificacions" (id_justificacion, descripcion, estado, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s)
            """, [instance.id_justificacion, instance.descripcion, instance.estado, now, now])
        print(f'Justificacion {instance.id_justificacion} creada en la base de datos PostgreSQL.')

@receiver(post_save, sender=Registro_just)
def create_registro_just_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                INSERT INTO "RegistroJust" (id_justificacion, rut_usuario, fecha_registro)
                VALUES (%s, %s, %s)
            """, [instance.id_justificacion, instance.rut_usuario, instance.fecha_registro])
        print(f'Registro_just {instance.id_justificacion} creado en la base de datos PostgreSQL.')

@receiver(post_save, sender=Notificacion)
def create_notificacion_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            now = timezone.now()
            cursor.execute("""
                INSERT INTO "Notificacions" (id_alerta, aviso, descripcion, id_asist, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, [instance.id_alerta, instance.aviso, instance.descripcion, instance.id_asist, now, now])
        print(f'Notificacion {instance.id_alerta} creada en la base de datos PostgreSQL.')

@receiver(post_save, sender=Asistencia)
def create_asistencia_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            now = timezone.now()
            cursor.execute("""
                INSERT INTO "Asistencias" (id_asist, colacion, observacion, id_marcaje, id_justificacion, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [instance.id_asist, instance.colacion, instance.observacion, instance.id_marcaje, instance.id_justificacion, now, now])
        print(f'Asistencia {instance.id_asist} creada en la base de datos PostgreSQL.')

@receiver(post_save, sender=Marcaje)
def create_marcaje_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            now = timezone.now()
            cursor.execute("""
                INSERT INTO "Marcajes" (id_marcaje, hora_ingreso, hora_salida, fecha, observacion, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [instance.id_marcaje, instance.hora_ingreso, instance.hora_salida, instance.fecha, instance.observacion, now, now])
        print(f'Marcaje {instance.id_marcaje} creado en la base de datos PostgreSQL.')
# Motivo
@receiver(post_save, sender=Motivo)  # Cambia Notificacion por Motivo si tienes el modelo
def create_motivo_in_postgres(sender, instance, created, **kwargs):
    if created:
        now = timezone.now()
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                INSERT INTO "Motivos" (id_motivo, descripcion, periodo, observaciones, id_justificacion, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [instance.id_motivo, instance.descripcion, instance.periodo, instance.observaciones, instance.id_justificacion, now, now])
        print(f'Motivo {instance.id_motivo} creado en la base de datos PostgreSQL.')

# QR
@receiver(post_save, sender=QR)  # Cambia Notificacion por QR si tienes el modelo
def create_qr_in_postgres(sender, instance, created, **kwargs):
    if created:
        now = timezone.now()
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                INSERT INTO "QRs" (id_qr, codigo, estado, createdat, updatedat)
                VALUES (%s, %s, %s, %s, %s)
            """, [instance.id_qr, instance.codigo, instance.estado, now, now])
        print(f'QR {instance.id_qr} creado en la base de datos PostgreSQL.')

@receiver(post_save, sender=Registro_marcaje)
def create_registro_marcaje_in_postgres(sender, instance, created, **kwargs):
    if created:
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                INSERT INTO "RegistroMarcaje" (rut_usuario, id_marcaje, id_totem, fecha_registro)
                VALUES (%s, %s, %s, %s)
            """, [instance.rut_usuario, instance.id_marcaje, instance.id_totem, instance.fecha_registro])
        print(f'Registro_marcaje {instance.rut_usuario} creado en la base de datos PostgreSQL.')




