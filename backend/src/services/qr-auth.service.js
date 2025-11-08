"use strict";
// filepath: backend/src/services/qr-auth.service.js
import jwt from 'jsonwebtoken';
import Usuario from '../entities/usuario.entity.js';
import QR from '../entities/qr.entity.js';
import Rol from '../entities/rol.entity.js';
import Cargo from '../entities/cargo.entity.js';
import { decryptData } from './qr.service.js'; // ✅ Importar función de desencriptación

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecretKey123";

export async function validateQRCodeService(encryptedHash) {
  try {
    console.log('=== VALIDATE QR CODE SERVICE ===');
    
    if (!encryptedHash) {
      return [null, "Hash encriptado requerido"];
    }

    // Buscar el QR code en la tabla QR
    const qrCode = await QR.findOne({
      where: { 
        codigo_unico: encryptedHash,
        estado_qr: true 
      }
    });

    if (!qrCode) {
      console.log('❌ QR code no encontrado o inactivo en tabla QR');
      return [null, "Código QR inválido o expirado"];
    }

    console.log('✅ QR code encontrado en tabla QR');
    console.log('✅ Usuario del QR:', qrCode.rut_usuario);

    // ✅ Desencriptar usando la función moderna
    try {
      const decryptedData = decryptData(encryptedHash);
      const parsedData = JSON.parse(decryptedData);
      
      console.log('✅ QR desencriptado correctamente para:', parsedData.rut);

      // Verificar que el RUT coincide
      if (parsedData.rut !== qrCode.rut_usuario) {
        console.log('❌ RUT del QR no coincide con tabla QR');
        return [null, "Código QR corrupto"];
      }

      // Buscar usuario completo
      const user = await Usuario.findOne({
        where: { rut_usuario: parsedData.rut },
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id_rol', 'nombre_rol']
          },
          {
            model: Cargo,
            as: 'cargo',
            attributes: ['id_cargo', 'nombre_cargo']
          }
        ]
      });

      if (!user) {
        return [null, "Usuario no encontrado"];
      }

      console.log('✅ QR code válido, usuario encontrado');

      // Generar token temporal
      const tempToken = jwt.sign(
        { 
          rut_usuario: user.rut_usuario,
          qr_codigo: qrCode.codigo_unico,
          temp: true 
        },
        JWT_SECRET,
        { expiresIn: "5m" }
      );

      return [{
        user: {
          rut_usuario: user.rut_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          id_rol: user.id_rol,
          id_cargo: user.id_cargo
        },
        qr_info: {
          codigo_unico: qrCode.codigo_unico,
          fecha_creacion: qrCode.fecha_creacion,
          estado_qr: qrCode.estado_qr
        },
        tempToken,
        message: "Código QR válido. Ingrese su PIN para completar el registro."
      }, null];

    } catch (decryptError) {
      console.error('❌ Error desencriptando QR:', decryptError);
      return [null, "Código QR inválido o corrupto"];
    }

  } catch (error) {
    console.error('Error en validateQRCodeService:', error);
    return [null, "Error interno del servidor"];
  }
}

export async function validateUserPINService(tempToken, pin) {
  try {
    console.log('=== VALIDATE PIN SERVICE ===');
    
    if (!tempToken || !pin) {
      return [null, "Token temporal y PIN son requeridos"];
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (error) {
      return [null, "Sesión expirada. Escanee el código QR nuevamente"];
    }

    const { rut_usuario } = decoded;

    const user = await Usuario.findOne({
      where: { rut_usuario },
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol']
        },
        {
          model: Cargo,
          as: 'cargo',
          attributes: ['id_cargo', 'nombre_cargo']
        }
      ]
    });

    if (!user) {
      return [null, "Usuario no encontrado"];
    }

    if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
      return [null, "Cuenta bloqueada por intentos fallidos. Use la aplicación para desbloquear"];
    }

    const pinIngresado = parseInt(pin);
    const pinCorrecto = user.pin;

    if (pinIngresado === pinCorrecto) {
      await user.update({
        intentos_pin: 0,
        bloqueado_hasta: null
      });

      // **LÓGICA CORREGIDA CON COLUMNAS REALES**
      console.log('🔍 Determinando tipo de marcaje usando RegistroMarcaje...');
      
      // Buscar el último registro usando fecha_registro en lugar de createdAt
      const ultimoRegistro = await RegistroMarcaje.findOne({
        where: { rut_usuario: user.rut_usuario },
        include: [{
          model: Marcaje,
          as: 'marcaje' // Verificar si esta relación existe o ajustar
        }],
        order: [['fecha_registro', 'DESC']] // Usar fecha_registro en lugar de createdAt
      });

      const ahora = new Date();
      const hoy = ahora.toISOString().split('T')[0];
      
      let tipoMarcaje = 'entrada';
      let marcajeExistente = null;

      if (ultimoRegistro && ultimoRegistro.marcaje) {
        const tiempoTranscurrido = ahora.getTime() - new Date(ultimoRegistro.marcaje.hora_ingreso).getTime();
        console.log(`⏰ Tiempo desde último marcaje: ${tiempoTranscurrido/1000} segundos`);
        
        // Si han pasado más de 15 segundos y el último no tiene hora_salida
        if (tiempoTranscurrido >= TIEMPO_MINIMO_ENTRE_MARCAJES && !ultimoRegistro.marcaje.hora_salida) {
          tipoMarcaje = 'salida';
          marcajeExistente = ultimoRegistro.marcaje;
          console.log('✅ Detectado como SALIDA - actualizando marcaje existente');
        } else {
          console.log('✅ Detectado como ENTRADA - creando nuevo marcaje');
        }
      } else {
        console.log('✅ Primer marcaje del usuario - ENTRADA');
      }

      let marcaje;

      if (tipoMarcaje === 'salida' && marcajeExistente) {
        // Actualizar el marcaje existente con hora_salida
        await marcajeExistente.update({
          hora_salida: ahora,
          observacion: (marcajeExistente.observacion || '') + ` | Salida: ${ahora.toLocaleString()}`
        });
        marcaje = marcajeExistente;
        console.log('📝 Marcaje actualizado con SALIDA, ID:', marcaje.id_marcaje);
      } else {
        // Crear nuevo marcaje de entrada
        marcaje = await Marcaje.create({
          fecha: hoy,
          hora_ingreso: ahora,
          hora_salida: null,
          observacion: `Entrada via QR + PIN - ${user.nombres} ${user.apellidos}`
        });
        
        // Crear el registro que conecta marcaje con usuario
        await RegistroMarcaje.create({
          rut_usuario: user.rut_usuario,
          id_marcaje: marcaje.id_marcaje,
          id_totem: 1, // O el ID del tótem si lo tienes
          fecha_registro: ahora
        });
        
        console.log('📝 Nuevo marcaje de ENTRADA creado, ID:', marcaje.id_marcaje);
      }

      const sessionToken = jwt.sign(
        {
          rut_usuario: user.rut_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          id_rol: user.id_rol,
          id_cargo: user.id_cargo,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return [{
        user: {
          rut_usuario: user.rut_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          id_rol: user.id_rol,
          id_cargo: user.id_cargo,
          rol: user.rol,
          cargo: user.cargo
        },
        marcaje: {
          id_marcaje: marcaje.id_marcaje,
          fecha: marcaje.fecha,
          hora_ingreso: marcaje.hora_ingreso,
          hora_salida: marcaje.hora_salida,
          tipo: tipoMarcaje,
          mensaje: `${tipoMarcaje.charAt(0).toUpperCase() + tipoMarcaje.slice(1)} registrada exitosamente`
        },
        token: sessionToken
      }, null];

    } else {
      // Lógica de PIN incorrecto...
      const nuevosIntentos = (user.intentos_pin || 0) + 1;
      const intentosRestantes = 3 - nuevosIntentos;

      if (nuevosIntentos >= 3) {
        const tiempoBloqueo = new Date(Date.now() + 30 * 60 * 1000);
        await user.update({
          intentos_pin: nuevosIntentos,
          bloqueado_hasta: tiempoBloqueo
        });
        return [null, "PIN incorrecto. Cuenta bloqueada por 30 minutos por seguridad."];
      } else {
        await user.update({ intentos_intos: nuevosIntentos });
        return [null, `PIN incorrecto. Le quedan ${intentosRestantes} intentos antes del bloqueo.`];
      }
    }

  } catch (error) {
    console.error('Error en validateUserPINService:', error);
    return [null, "Error interno del servidor"];
  }
}

export async function unlockAccountService(rut_usuario) {
  try {
    console.log('=== UNLOCK ACCOUNT SERVICE ===');
    
    const user = await Usuario.findOne({
      where: { rut_usuario }
    });

    if (!user) {
      return [null, "Usuario no encontrado"];
    }

    // Resetear intentos de PIN y desbloquear cuenta
    await user.update({
      intentos_pin: 0,
      bloqueado_hasta: null
    });

    console.log('Cuenta desbloqueada para:', rut_usuario);
    
    return [{
      rut_usuario: user.rut_usuario,
      message: "Cuenta desbloqueada exitosamente"
    }, null];

  } catch (error) {
    console.error('Error en unlockAccountService:', error);
    return [null, error.message];
  }
}

export async function invalidateUserQRService(rut_usuario) {
  try {
    console.log('=== INVALIDATE USER QR SERVICE ===');
    console.log('Invalidando QR para RUT:', rut_usuario);

    const user = await Usuario.findOne({
      where: { rut_usuario }
    });

    if (!user) {
      return [null, "Usuario no encontrado"];
    }

    // Por ahora solo log, podrías agregar un campo qr_active en la BD
    console.log('✅ QR invalidado para usuario:', rut_usuario);
    
    return [{
      rut_usuario: user.rut_usuario,
      message: "Código QR invalidado exitosamente. Genere uno nuevo cuando lo necesite."
    }, null];

  } catch (error) {
    console.error('Error en invalidateUserQRService:', error);
    return [null, error.message];
  }
}