"use strict";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/envconfig.js";
import Usuario from "../entities/usuario.entity.js";

// Lista negra de tokens (en producción usar Redis o base de datos)
const tokenBlacklist = new Set();

// Tiempo de expiración del token en segundos
const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 horas
const REFRESH_THRESHOLD = 2 * 60 * 60; // 2 horas antes de expirar

export class TokenService {
  /**
   * Genera un nuevo token JWT con tiempo de expiración
   */
  static generateToken(payload) {
    return jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );
  }

  /**
   * Verifica si un token es válido y no está en la lista negra
   */
  static verifyToken(token) {
    try {
      if (tokenBlacklist.has(token)) {
        throw new Error('Token invalidado');
      }
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = decoded.exp - now;
      return {
        valid: true,
        decoded,
        shouldRefresh: timeUntilExpiration <= REFRESH_THRESHOLD,
        timeRemaining: timeUntilExpiration
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        shouldRefresh: false,
        timeRemaining: 0
      };
    }
  }

  /**
   * Invalida un token añadiéndolo a la lista negra
   */
  static invalidateToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp > now) {
          tokenBlacklist.add(token);
          const timeUntilExpiration = (decoded.exp - now) * 1000;
          setTimeout(() => {
            tokenBlacklist.delete(token);
          }, timeUntilExpiration);
          return { success: true, message: 'Token invalidado correctamente' };
        }
      }
      return { success: true, message: 'Token ya expirado' };
    } catch (error) {
      console.error('Error al invalidar token:', error);
      return { success: false, message: 'Error al invalidar token' };
    }
  }

  /**
   * Renueva un token si es válido y está próximo a expirar
   */
  static async refreshToken(oldToken) {
    try {
      const verification = this.verifyToken(oldToken);
      if (!verification.valid) {
        return [null, 'Token inválido o expirado'];
      }

      // Buscar usuario en la base de datos usando Sequelize
      const user = await Usuario.findOne({
        where: { email: verification.decoded.email }
      });

      if (!user) {
        return [null, 'Usuario no encontrado'];
      }

      // Invalidar el token anterior
      this.invalidateToken(oldToken);

      // Generar nuevo token
      const newTokenPayload = {
        nombreCompleto: user.nombres + " " + user.apellidos,
        email: user.email,
        rut: user.rut_usuario,
        rol: user.rol, // Ajusta si tienes el campo rol en tu modelo
        flag_blacklist: user.flag_blacklist // Ajusta si tienes este campo
      };

      const newToken = this.generateToken(newTokenPayload);

      return [newToken, null];
    } catch (error) {
      console.error('Error al renovar token:', error);
      return [null, 'Error interno del servidor'];
    }
  }

  /**
   * Obtiene información sobre un token
   */
  static getTokenInfo(token) {
    try {
      const verification = this.verifyToken(token);
      if (!verification.valid) {
        return { valid: false, error: verification.error };
      }
      const { decoded } = verification;
      const now = Math.floor(Date.now() / 1000);
      return {
        valid: true,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        timeRemaining: decoded.exp - now,
        shouldRefresh: verification.shouldRefresh,
        user: {
          email: decoded.email,
          rol: decoded.rol,
          nombreCompleto: decoded.nombreCompleto,
          flag_blacklist: decoded.flag_blacklist,
        }
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Limpia tokens expirados de la lista negra (mantenimiento)
   */
  static cleanupExpiredTokens() {
    const now = Math.floor(Date.now() / 1000);
    for (const token of tokenBlacklist) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp && decoded.exp <= now) {
          tokenBlacklist.delete(token);
        }
      } catch (error) {
        tokenBlacklist.delete(token);
      }
    }
  }
}

// Limpieza automática cada 6 horas
setInterval(() => {
  TokenService.cleanupExpiredTokens();
}, 6 * 60 * 60 * 1000);

export default TokenService;