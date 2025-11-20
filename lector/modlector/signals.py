# modlector/signals.py
import requests
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Cargo, Rol, Totem, Usuario, Justificacion, Registro_just, Notificacion, Asistencia, Marcaje, QR, Motivo
from django.conf import settings

BACKEND_URL = getattr(settings, "BACKEND_URL", "http://localhost:3000")
ENABLE_BACKEND_SYNC = getattr(settings, "ENABLE_BACKEND_SYNC", False)

# COMENTAR TODOS LOS SIGNALS CON #
# ================================

# @receiver(post_save, sender=Cargo)
# def sync_cargo_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "id_cargo": instance.id_cargo,
#         "nombre_cargo": instance.nombre_cargo,
#         "horas_trabajar": instance.horas_trabajar,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}/api/cargos", json=data, timeout=5)
#             print(f'[SYNC] Cargo {instance.nombre_cargo} creado en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}/api/cargos/{instance.id_cargo}", json=data, timeout=5)
#             print(f'[SYNC] Cargo {instance.nombre_cargo} actualizado en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar Cargo con backend: {e}")

# @receiver(post_save, sender=Rol)
# def sync_rol_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "id_rol": instance.id_rol,
#         "nombre_rol": instance.nombre_rol,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}/api/roles", json=data, timeout=5)
#             print(f'[SYNC] Rol {instance.nombre_rol} creado en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}/api/roles/{instance.id_rol}", json=data, timeout=5)
#             print(f'[SYNC] Rol {instance.nombre_rol} actualizado en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar Rol con backend: {e}")

# @receiver(post_save, sender=Totem)
# def sync_totem_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "id_totem": instance.id_totem,
#         "ubicacion": instance.ubicacion,
#         "descripcion": instance.descripcion,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}/api/totems", json=data, timeout=5)
#             print(f'[SYNC] Totem {instance.ubicacion} creado en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}/api/totems/{instance.id_totem}", json=data, timeout=5)
#             print(f'[SYNC] Totem {instance.ubicacion} actualizado en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar Totem con backend: {e}")

# @receiver(post_save, sender=Usuario)
# def sync_usuario_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "rut_usuario": instance.rut_usuario,
#         "nombres": instance.first_name,
#         "apellidos": instance.last_name,
#         "email": instance.email,
#         "horas_atrabajar": instance.horas_atrabajar,
#         "pin": instance.pin,
#         "intentos_pin": instance.intentos_pin,
#         "bloqueado_hasta": instance.bloqueado_hasta,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}users", json=data, timeout=5)
#             print(f'[SYNC] Usuario {instance.first_name} {instance.last_name} creado en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}users/{instance.rut_usuario}", json=data, timeout=5)
#             print(f'[SYNC] Usuario {instance.first_name} {instance.last_name} actualizado en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar Usuario con backend: {e}")

# @receiver(post_save, sender=Justificacion)
# def sync_justificacion_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "id_justificacion": instance.id_justificacion,
#         "descripcion": instance.descripcion,
#         "estado": instance.estado,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}/api/justificaciones", json=data, timeout=5)
#             print(f'[SYNC] Justificacion {instance.id_justificacion} creada en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}/api/justificaciones/{instance.id_justificacion}", json=data, timeout=5)
#             print(f'[SYNC] Justificacion {instance.id_justificacion} actualizada en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar Justificacion con backend: {e}")

# @receiver(post_save, sender=Marcaje)
# def sync_marcaje_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "id_marcaje": instance.id_marcaje,
#         "hora_ingreso": instance.hora_ingreso.isoformat() if instance.hora_ingreso else None,
#         "hora_salida": instance.hora_salida.isoformat() if instance.hora_salida else None,
#         "fecha": instance.fecha.isoformat() if instance.fecha else None,
#         "observacion": instance.observacion,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}/api/marcajes", json=data, timeout=5)
#             print(f'[SYNC] Marcaje {instance.id_marcaje} creado en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}/api/marcajes/{instance.id_marcaje}", json=data, timeout=5)
#             print(f'[SYNC] Marcaje {instance.id_marcaje} actualizado en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar Marcaje con backend: {e}")

# @receiver(post_save, sender=QR)
# def sync_qr_with_backend(sender, instance, created, **kwargs):
#     data = {
#         "codigo_unico": instance.codigo_unico,
#         "estado_qr": instance.estado_qr,
#         "fecha_creacion": instance.fecha_creacion.isoformat() if instance.fecha_creacion else None,
#         "rut_usuario": instance.rut_usuario.rut_usuario if instance.rut_usuario else None,
#     }
#     try:
#         if created:
#             requests.post(f"{BACKEND_URL}/api/qrs", json=data, timeout=5)
#             print(f'[SYNC] QR {instance.codigo_unico} creado en backend.')
#         else:
#             requests.put(f"{BACKEND_URL}/api/qrs/{instance.codigo_unico}", json=data, timeout=5)
#             print(f'[SYNC] QR {instance.codigo_unico} actualizado en backend.')
#     except requests.RequestException as e:
#         print(f"[ERROR] No se pudo sincronizar QR con backend: {e}")

print("[SIGNALS] Todos los signals de sincronización están deshabilitados")