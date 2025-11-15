from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.utils import timezone
from .models import QR, Usuario, Marcaje, Registro_marcaje, Totem
from django.views.decorators.csrf import csrf_exempt
import json

def lector_qr_view(request):
    """Vista para mostrar la página del lector QR con código de barras"""
    return render(request, 'lector/lector_qr.html')

@csrf_exempt
def procesar_qr(request):
    """Procesa el código QR escaneado y solicita PIN"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            codigo_qr = data.get('codigo_qr')
            
            # Buscar el QR en la base de datos
            qr_obj = get_object_or_404(QR, codigo_unico=codigo_qr, estado_qr=True)
            usuario = qr_obj.rut_usuario
            
            return JsonResponse({
                'success': True,
                'usuario': {
                    'rut': usuario.rut_usuario,
                    'nombre': f"{usuario.first_name} {usuario.last_name}",
                    'cargo': usuario.id_cargo.nombre_cargo if usuario.id_cargo else 'Sin cargo'
                }
            })
            
        except QR.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Código QR no válido o inactivo'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': 'Error al procesar el código QR'
            })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@csrf_exempt
def verificar_pin(request):
    """Verifica el PIN del usuario y registra el marcaje"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            codigo_qr = data.get('codigo_qr')
            pin_ingresado = data.get('pin')
            totem_id = data.get('totem_id', 1)  # ID del totem por defecto
            
            # Buscar el QR y usuario
            qr_obj = get_object_or_404(QR, codigo_unico=codigo_qr, estado_qr=True)
            usuario = qr_obj.rut_usuario
            
            # Verificar si el usuario está bloqueado
            if usuario.bloqueado_hasta and usuario.bloqueado_hasta > timezone.now():
                return JsonResponse({
                    'success': False,
                    'error': f'Usuario bloqueado hasta {usuario.bloqueado_hasta.strftime("%H:%M:%S")}'
                })
            
            # Verificar PIN
            if usuario.pin == pin_ingresado:
                # PIN correcto - resetear intentos
                usuario.intentos_pin = 0
                usuario.bloqueado_hasta = None
                usuario.save()
                
                # Crear marcaje
                ahora = timezone.now()
                fecha_hoy = ahora.date()
                
                # Verificar si ya hay un marcaje para hoy
                marcaje_existente = Marcaje.objects.filter(
                    registro_marcaje__rut_usuario=usuario,
                    fecha=fecha_hoy
                ).first()
                
                if marcaje_existente:
                    # Es salida
                    if not marcaje_existente.hora_salida:
                        marcaje_existente.hora_salida = ahora
                        marcaje_existente.save()
                        tipo_marcaje = 'salida'
                    else:
                        return JsonResponse({
                            'success': False,
                            'error': 'Ya se registró ingreso y salida para hoy'
                        })
                else:
                    # Es ingreso
                    marcaje = Marcaje.objects.create(
                        hora_ingreso=ahora,
                        fecha=fecha_hoy
                    )
                    
                    # Crear registro de marcaje
                    totem = get_object_or_404(Totem, id_totem=totem_id)
                    Registro_marcaje.objects.create(
                        rut_usuario=usuario,
                        id_marcaje=marcaje,
                        id_totem=totem
                    )
                    tipo_marcaje = 'ingreso'
                
                return JsonResponse({
                    'success': True,
                    'tipo_marcaje': tipo_marcaje,
                    'usuario': f"{usuario.first_name} {usuario.last_name}",
                    'hora': ahora.strftime("%H:%M:%S")
                })
            
            else:
                # PIN incorrecto - incrementar intentos
                usuario.intentos_pin += 1
                
                if usuario.intentos_pin >= 3:
                    # Bloquear por 5 minutos
                    usuario.bloqueado_hasta = timezone.now() + timezone.timedelta(minutes=5)
                    usuario.save()
                    return JsonResponse({
                        'success': False,
                        'error': 'PIN incorrecto. Usuario bloqueado por 5 minutos'
                    })
                else:
                    usuario.save()
                    intentos_restantes = 3 - usuario.intentos_pin
                    return JsonResponse({
                        'success': False,
                        'error': f'PIN incorrecto. Intentos restantes: {intentos_restantes}'
                    })
                    
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': 'Error al verificar PIN'
            })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def reset_session(request):
    """Reinicia la sesión del lector"""
    return JsonResponse({'success': True})