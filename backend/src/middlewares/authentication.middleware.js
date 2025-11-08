"use strict";
import passport from "passport";
import TokenService from "../services/token.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  } from "../handlers/responseHandlers.js";

export function authenticateJwt(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return handleErrorServer(
        res,
        500,
        "Error de autenticación en el servidor"
      );
    }
    if (!user) {
      return handleErrorClient(
        res,
        401,
        "No tienes permiso para acceder a este recurso",
        { info: info ? info.message : "No se encontró el usuario" }
      )
    }

    req.user = user;
    next();
  })(req, res, next);
}

export function authenticateJwtWithTokenService(req, res, next) {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return handleErrorClient(
        res,
        401,
        "Token de acceso requerido",
        "No se proporcionó un token de autorización"
      );
    }

    // Verificar el token usando TokenService
    const verification = TokenService.verifyToken(token);

    if (!verification.valid) {
      return handleErrorClient(
        res,
        401,
        "Token inválido o expirado",
        verification.error
      );
    }

    // Establecer la información del usuario en la request
    req.user = verification.decoded;
    req.tokenInfo = {
      shouldRefresh: verification.shouldRefresh,
      timeRemaining: verification.timeRemaining
    };

    // Agregar header con información sobre renovación si es necesario
    if (verification.shouldRefresh) {
      res.setHeader('X-Token-Refresh-Suggested', 'true');
      res.setHeader('X-Token-Time-Remaining', verification.timeRemaining);
    }

    next();
  } catch (error) {
    return handleErrorServer(
      res,
      500,
      "Error interno en autenticación",
      error.message
    );
  }
}