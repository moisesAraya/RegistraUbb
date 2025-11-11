from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.utils import timezone
from .models import QR, Usuario, Marcaje, Totem, Registro_marcaje
from django.views.decorators.csrf import csrf_exempt
import json

def configuracion_totem_view(request):
    """Vista para configurar el totem del dispositivo"""
    totems = Totem.objects.all()
    return render(request, 'lector/configuracion_totem.html', {'totems': totems})

@csrf_exempt
def guardar_totem(request):
    """Guarda la configuración del totem en la sesión"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            totem_id = data.get('totem_id')
            
            # Verificar que el totem existe
            totem = get_object_or_404(Totem, id_totem=totem_id)
            
            # Guardar en sesión
            request.session['totem_id'] = totem_id
            
            return JsonResponse({
                'success': True,
                'totem': {
                    'id': totem.id_totem,
                    'ubicacion': totem.ubicacion
                }
            })
            
        except Totem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Totem no encontrado'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': 'Error al guardar configuración'
            })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def lector_qr_view(request):
    """Vista para mostrar la página del lector QR con código de barras"""
    # Verificar si el totem está configurado
    totem_id = request.session.get('totem_id')
    if not totem_id:
        return redirect('configuracion_totem')
    
    # Obtener información del totem para mostrar
    try:
        totem = Totem.objects.get(id_totem=totem_id)
        context = {
            'totem': {
                'id': totem.id_totem,
                'ubicacion': totem.ubicacion
            }
        }
    except Totem.DoesNotExist:
        # Si el totem no existe, redirigir a configuración
        return redirect('configuracion_totem')
    
    return render(request, 'lector/lector_qr.html', context)

@csrf_exempt
def procesar_qr(request):
    """Procesa el código QR escaneado y solicita PIN"""
    if request.method == 'POST':
        try:
            # Verificar que el totem esté configurado
            totem_id = request.session.get('totem_id')
            if not totem_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Dispositivo no configurado. Configurar totem primero.'
                })
            
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
    """Verifica el PIN del usuario y registra el marcaje (múltiples marcajes por día)"""
    if request.method == 'POST':
        try:
            # Verificar que el totem esté configurado
            totem_id = request.session.get('totem_id')
            if not totem_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Dispositivo no configurado'
                })
            
            data = json.loads(request.body)
            codigo_qr = data.get('codigo_qr')
            pin_ingresado = data.get('pin')
            
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
                
                # Obtener la hora actual
                ahora = timezone.now()
                fecha_hoy = ahora.date()
                
                # Obtener el totem
                totem = get_object_or_404(Totem, id_totem=totem_id)
                
                # Buscar todos los marcajes del usuario para hoy, ordenados por fecha de creación
                # Obtenemos los IDs de marcajes del usuario a través de Registro_marcaje
                marcajes_ids = Registro_marcaje.objects.filter(
                    rut_usuario=usuario.rut_usuario
                ).values_list('id_marcaje', flat=True)
                
                marcajes_hoy = Marcaje.objects.filter(
                    id_marcaje__in=marcajes_ids,
                    fecha=fecha_hoy
                ).order_by('createdAt')
                
                # Determinar el tipo de marcaje basado en el último estado
                if not marcajes_hoy.exists():
                    # No hay marcajes hoy, es el primer ingreso
                    tipo_marcaje = 'ingreso'
                    crear_nuevo_marcaje = True
                else:
                    # Hay marcajes previos, verificar el último
                    ultimo_marcaje = marcajes_hoy.last()
                    
                    if ultimo_marcaje.hora_salida is None:
                        # El último marcaje no tiene salida, es una salida
                        ultimo_marcaje.hora_salida = ahora
                        ultimo_marcaje.save()
                        tipo_marcaje = 'salida'
                        crear_nuevo_marcaje = False
                    else:
                        # El último marcaje ya tiene salida, es un nuevo ingreso
                        tipo_marcaje = 'ingreso'
                        crear_nuevo_marcaje = True
                
                # Crear nuevo marcaje si es necesario
                if crear_nuevo_marcaje:
                    # Crear el marcaje
                    nuevo_marcaje = Marcaje.objects.create(
                        hora_ingreso=ahora,
                        fecha=fecha_hoy
                    )
                    
                    # Crear el registro que conecta usuario, marcaje y totem
                    Registro_marcaje.objects.create(
                        rut_usuario=usuario.rut_usuario,
                        id_marcaje=nuevo_marcaje,
                        id_totem=totem
                    )
                
                # Contar marcajes del día para mostrar información adicional
                total_marcajes_hoy = marcajes_hoy.count() + (1 if crear_nuevo_marcaje else 0)
                numero_marcaje = total_marcajes_hoy if tipo_marcaje == 'ingreso' else total_marcajes_hoy
                
                return JsonResponse({
                    'success': True,
                    'tipo_marcaje': tipo_marcaje,
                    'numero_marcaje': numero_marcaje,
                    'usuario': f"{usuario.first_name} {usuario.last_name}",
                    'hora': ahora.strftime("%H:%M:%S"),
                    'fecha': fecha_hoy.strftime("%d/%m/%Y"),
                    'total_marcajes_hoy': total_marcajes_hoy,
                })
            
            else:
                # PIN incorrecto - incrementar intentos
                if usuario.intentos_pin is None:
                    usuario.intentos_pin = 0
                    
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
                    
        except QR.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Código QR no válido'
            })
        except Totem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Totem no encontrado'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Error interno del servidor: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@csrf_exempt
def obtener_marcajes_usuario(request):
    """Obtiene el historial de marcajes del usuario para hoy"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            codigo_qr = data.get('codigo_qr')
            
            # Buscar el QR y usuario
            qr_obj = get_object_or_404(QR, codigo_unico=codigo_qr, estado_qr=True)
            usuario = qr_obj.rut_usuario
            
            # Obtener marcajes de hoy
            fecha_hoy = timezone.now().date()
            # Obtenemos los IDs de marcajes del usuario a través de Registro_marcaje
            marcajes_ids = Registro_marcaje.objects.filter(
                rut_usuario=usuario.rut_usuario
            ).values_list('id_marcaje', flat=True)
            
            marcajes_hoy = Marcaje.objects.filter(
                id_marcaje__in=marcajes_ids,
                fecha=fecha_hoy
            ).order_by('createdAt')
            
            historial = []
            for i, marcaje in enumerate(marcajes_hoy, 1):
                historial.append({
                    'numero': i,
                    'ingreso': marcaje.hora_ingreso.strftime("%H:%M:%S") if marcaje.hora_ingreso else None,
                    'salida': marcaje.hora_salida.strftime("%H:%M:%S") if marcaje.hora_salida else None,
                    'completo': marcaje.hora_salida is not None
                })
            
            return JsonResponse({
                'success': True,
                'marcajes': historial,
                'total': len(historial)
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': 'Error al obtener marcajes'
            })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def reset_session(request):
    """Reinicia la sesión del lector"""
    return JsonResponse({'success': True})

@csrf_exempt
def reconfigurar_totem(request):
    """Permite reconfigurar el totem"""
    if 'totem_id' in request.session:
        del request.session['totem_id']
    if 'totem_nombre' in request.session:
        del request.session['totem_nombre']
    
    return JsonResponse({'success': True, 'redirect': True})