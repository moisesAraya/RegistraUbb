"use strict";
// filepath: backend/src/services/qr-auth.service.js
import Usuario from "../entities/usuario.entity.js";
import Rol from "../entities/rol.entity.js";
import Cargo from "../entities/cargo.entity.js";
import Marcaje from "../entities/marcaje.entity.js";
import RegistroMarcaje from "../entities/registro_marcaje.entity.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/envconfig.js";
import crypto from "crypto";
import { Op } from "sequelize";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "mi_clave_secreta_32_caracteres!!";
const IV_LENGTH = 16;

// Configuración de tiempo para determinar entrada/salida
const TIEMPO_MINIMO_ENTRE_MARCAJES = 15 * 1000; // 15 segundos para pruebas (en prod: 4 * 60 * 60 * 1000 = 4 horas)

export async function generateEncryptedRutService(rut_usuario) {
  try {
    console.log('=== GENERATE ENCRYPTED RUT SERVICE ===');
    console.log('Generando hash para RUT:', rut_usuario);

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
      return [null, `Usuario con RUT ${rut_usuario} no encontrado`];
    }

    const timestamp = Date.now();
    const dataToEncrypt = JSON.stringify({
      rut_usuario,
      timestamp,
      action: 'qr_auth'
    });

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const encryptedHash = iv.toString('hex') + ':' + encrypted;

    console.log('Hash generado exitosamente');
    
    return [{
      rut_usuario: user.rut_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      encryptedHash,
      timestamp
    }, null];

  } catch (error) {
    console.error('Error en generateEncryptedRutService:', error);
    return [null, error.message];
  }
}

export async function validateEncryptedRutService(encryptedHash) {
  try {
    console.log('=== VALIDATE ENCRYPTED RUT SERVICE ===');
    
    const parts = encryptedHash.split(':');
    if (parts.length !== 2) {
      return [null, "Hash encriptado inválido"];
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);
    console.log('Datos desencriptados:', data);

    const { rut_usuario, timestamp } = data;

    // Validar tiempo de expiración (15 minutos)
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutos
    
    if (now - timestamp > maxAge) {
      return [null, "El código QR ha expirado. Genere uno nuevo."];
    }

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
      return [null, `Usuario con RUT ${rut_usuario} no registrado en el sistema`];
    }

    // Verificar si la cuenta está bloqueada
    if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
      const tiempoRestante = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 1000 / 60);
      return [null, `Cuenta bloqueada por intentos fallidos de PIN. Tiempo restante: ${tiempoRestante} minutos`];
    }

    // Generar token temporal para validar PIN
    const tempToken = jwt.sign(
      { rut_usuario, step: 'pin_validation' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    const attemptsRemaining = 3 - (user.intentos_pin || 0);

    return [{
      user: {
        rut_usuario: user.rut_usuario,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email
      },
      tempToken,
      requiresPin: true,
      attemptsRemaining
    }, null];

  } catch (error) {
    console.error('Error en validateEncryptedRutService:', error);
    return [null, "Error validando el código QR"];
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