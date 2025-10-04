"use strict";
import {
  loginService,
  registerService,
  recoverPasswordService,
  verifyEmailService
} from "../services/auth.service.js";

import { loginValidation, registerValidation } from "../validations/auth.validation.js";

import TokenService from "../services/token.service.js";

import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess
} from "../handlers/responseHandlers.js";

export async function login(req, res) {
  try {
    console.log("=== BACKEND LOGIN DEBUG ===");
    console.log("Body recibido:", JSON.stringify(req.body, null, 2));
    
    const { email, password } = req.body;
    
    console.log("Email:", `"${email}"`);
    console.log("Password:", `"${password}"`);
    
    // Validación básica
    if (!email || !password) {
      console.log("❌ Campos faltantes");
      return handleErrorClient(res, 400, "Email y contraseña son requeridos");
    }

    // Validación con Joi
    console.log("🔍 Validando con Joi...");
    const { error } = loginValidation.validate({ email, password });
    
    if (error) {
      console.log("❌ Error de validación:", error.details[0].message);
      return handleErrorClient(res, 400, "Error de validación", error.details[0].message);
    }

    console.log("✅ Validación exitosa, llamando al servicio...");
    
    // Usar el servicio de login
    const [result, loginError] = await loginService({ email, password });
    
    if (loginError) {
      console.log("❌ Error del servicio:", loginError);
      return handleErrorClient(res, 401, "Error de autenticación", loginError);
    }

    console.log("✅ Login exitoso para:", email);
    handleSuccess(res, 200, "Login exitoso", result);

  } catch (error) {
    console.error("💥 Error inesperado en login:", error);
    handleErrorServer(res, 500, error.message);
  }
}

export async function register(req, res) {
  try {
    const { body } = req;
    const { error } = registerValidation.validate(body);

    if (error) {
      return handleErrorClient(res, 400, "Error de validación", error.message);
    }

    const [result, errorRegister] = await registerService(body);

    if (errorRegister) {
      return handleErrorClient(res, 400, "Error registrando al usuario", errorRegister.message || errorRegister);
    }

    handleSuccess(res, 201, "Usuario registrado con éxito", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
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