"use strict";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/envconfig.js";
import Usuario from "../entities/usuario.entity.js";

const tokenBlacklist = new Set();

const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 horas
const REFRESH_THRESHOLD = 2 * 60 * 60; // 2 horas antes de expirar

export class TokenService {

  static generateToken(payload) {
    return jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );
  }

  static verifyToken(token) {
    try {
      if (tokenBlacklist.has(token)) {
        throw new Error('Token invalidado');
      }
      const decoded = jwt.verify(token, JWT_SECRET);
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


  static async refreshToken(oldToken) {
    try {
      const verification = this.verifyToken(oldToken);
      if (!verification.valid) {
        return [null, 'Token inválido o expirado'];
      }

      const user = await Usuario.findOne({
        where: { email: verification.decoded.email }
      });

      if (!user) {
        return [null, 'Usuario no encontrado'];
      }

      this.invalidateToken(oldToken);

      const newTokenPayload = {
        nombreCompleto: user.nombres + " " + user.apellidos,
        email: user.email,
        rut: user.rut_usuario,
        rol: user.rol, 
        flag_blacklist: user.flag_blacklist 
      };

      const newToken = this.generateToken(newTokenPayload);

      return [newToken, null];
    } catch (error) {
      console.error('Error al renovar token:', error);
      return [null, 'Error interno del servidor'];
    }
  }

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

setInterval(() => {
  TokenService.cleanupExpiredTokens();
}, 6 * 60 * 60 * 1000);

export default TokenService;