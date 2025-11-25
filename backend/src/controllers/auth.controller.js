"use strict";
import {
  loginService,
  registerService,
  recoverPasswordService,
  verifyEmailService
} from "../services/auth.service.js";

import { loginValidation, registerValidation } from "../validations/auth.validation.js";
import { processRut } from "../utils/rut.utils.js";

import TokenService from "../services/token.service.js";

import { unlockAccountService } from "../services/qr-auth.service.js";

import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess
} from "../handlers/responseHandlers.js";

export async function login(req, res) {
  try {
    console.log('=== LOGIN CONTROLLER ===');
    console.log('Body original:', req.body);

    // Validar con Joi (esto ya normaliza el RUT automáticamente)
    const { error, value } = loginValidation.validate(req.body);
    
    if (error) {
      console.log('Error de validación:', error.details[0].message);
      return handleErrorClient(res, 400, error.details[0].message);
    }

    const { rut_usuario, password } = value; // rut_usuario ya está normalizado por Joi
    
    console.log('RUT normalizado:', rut_usuario);
    console.log('Password recibido:', password ? '***' : 'vacío');

    // Buscar usuario con el RUT normalizado
    const [loginResult, loginError] = await loginService({ rut_usuario, password });

    if (loginError) {
      console.log('Error del servicio de login:', loginError);
      return handleErrorClient(res, 401, loginError);
    }

    console.log('Usuario encontrado:', loginResult.user.rut_usuario, loginResult.user.nombres);
    
    // ✅ AGREGAR COOKIE SEGURA CON TOKEN
    if (loginResult.token) {
      res.cookie("token", loginResult.token, {
        httpOnly: true,
        secure: true,      // HTTPS habilitado en producción
        sameSite: "lax",   // Protección CSRF
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });
    }
    
    handleSuccess(res, 200, "Login exitoso", loginResult.user);
    
  } catch (error) {
    console.error('Error en login controller:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

export async function register(req, res) {
  try {
    console.log('=== REGISTER CONTROLLER ===');
    console.log('Body original:', req.body);

    // Validar con Joi (esto normaliza el RUT automáticamente)
    const { error, value } = registerValidation.validate(req.body);

    if (error) {
      console.log('Error de validación:', error.details[0].message);
      return handleErrorClient(res, 400, error.details[0].message);
    }

    console.log('Datos validados y normalizados:', value);

    // Registrar usuario con datos normalizados
    const [newUser, registerError] = await registerService(value);

    if (registerError) {
      console.log('Error del servicio de registro:', registerError);
      return handleErrorClient(res, 400, registerError);
    }

    console.log('Usuario registrado:', newUser.rut_usuario);
    handleSuccess(res, 201, "Usuario registrado exitosamente", newUser);

  } catch (error) {
    console.error('Error en register controller:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(`${process.env.VITE_API_BASE_URL}/verified-email?success=false&message=Token%20de%20verificación%20requerido`);
    }

    const [result, errorVerify] = await verifyEmailService(token);

    if (errorVerify) {
      return res.redirect(`${process.env.VITE_API_BASE_URL}/verified-email?success=false&message=${encodeURIComponent(errorVerify)}`);
    }

    return res.redirect(`${process.env.VITE_API_BASE_URL}/verified-email?success=true`);
  } catch (error) {
    return res.redirect(`${process.env.VITE_API_BASE_URL}/verified-email?success=false&message=${encodeURIComponent(error.message)}`);
  }
}

export async function recoverPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return handleErrorClient(res, 400, "Faltan datos requeridos");
    }

    const [result, errorRecover] = await recoverPasswordService(token, newPassword);

    if (errorRecover) {
      return handleErrorClient(res, 400, "Error al recuperar la contraseña", errorRecover);
    }

    handleSuccess(res, 200, "Contraseña actualizada con éxito");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (token) {
      const result = TokenService.invalidateToken(token);
      if (!result.success) {
        console.warn("⚠️ Error al invalidar token durante logout:", result.message);
      }
    }

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    handleSuccess(res, 200, "Sesión cerrada exitosamente", {
      message: "Token invalidado y sesión terminada"
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function refreshToken(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return handleErrorClient(res, 401, "Token requerido para renovación");
    }

    const [newToken, errorRefresh] = await TokenService.refreshToken(token);

    if (errorRefresh) {
      return handleErrorClient(res, 401, "Error al renovar token", errorRefresh);
    }

    res.cookie("jwt", newToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: false,
    });

    handleSuccess(res, 200, "Token renovado exitosamente", {
      token: newToken,
      message: "Sesión extendida por 24 horas"
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getTokenInfo(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return handleErrorClient(res, 401, "Token requerido");
    }

    const tokenInfo = TokenService.getTokenInfo(token);

    if (!tokenInfo.valid) {
      return handleErrorClient(res, 401, "Token inválido", tokenInfo.error);
    }

    handleSuccess(res, 200, "Información del token obtenida", {
      issuedAt: tokenInfo.issuedAt,
      expiresAt: tokenInfo.expiresAt,
      timeRemainingSeconds: tokenInfo.timeRemaining,
      shouldRefresh: tokenInfo.shouldRefresh,
      user: tokenInfo.user
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}