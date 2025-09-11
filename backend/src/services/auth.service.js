"use strict";
import Usuario from "../entities/usuario.entity.js";
import jwt from "jsonwebtoken";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { JWT_SECRET } from "../config/envconfig.js";
// import { addMinutes, isBefore } from "date-fns";
// import { sendLoginAlertEmail, sendVerificationEmail } from "../helpers/email.helper.js";
import TokenService from "./token.service.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 3; // en minutos

export async function loginService(user) {
  try {
    const { email, password } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    const userFound = await Usuario.findOne({ where: { email } });

    if (!userFound) {
      return [null, createErrorMessage("email", "El correo electrónico es incorrecto")];
    }

    // Preguntar si usaremos el bloqueo por intentos fallidos
    /*
    if (userFound.bloqueadoHasta && isBefore(new Date(), userFound.bloqueadoHasta)) {
      return [null, createErrorMessage("email", "Cuenta temporalmente bloqueada por intentos fallidos. Intenta más tarde.")];
    }
    */

    const isMatch = await comparePassword(password, userFound.password);

    /*
    if (!isMatch) {
      userFound.intentosFallidos = (userFound.intentosFallidos || 0) + 1;

      if (userFound.intentosFallidos >= MAX_LOGIN_ATTEMPTS) {
        userFound.bloqueadoHasta = addMinutes(new Date(), LOCK_TIME);
        userFound.intentosFallidos = 0;

        await userFound.save();
        await sendLoginAlertEmail(userFound.email);

        return [null, createErrorMessage("email", "Cuenta bloqueada temporalmente. Revisa tu email.")];
      }

      await userFound.save();
      return [null, createErrorMessage("password", "La contraseña es incorrecta")];
    }

    userFound.intentosFallidos = 0;
    userFound.bloqueadoHasta = null;
    */

    if (!isMatch) {
      return [null, createErrorMessage("password", "La contraseña es incorrecta")];
    }

    const payload = {
      nombreCompleto: `${userFound.nombre} ${userFound.apellidos}`,
      email: userFound.email,
      rut: userFound.rut,
      rol: userFound.rol,
    };

    const accessToken = TokenService.generateToken(payload);

    const userData = {
      id_usuario: userFound.id_usuario,
      nombre: userFound.nombre,
      apellidos: userFound.apellidos,
      email: userFound.email,
      rut: userFound.rut,
      rol: userFound.rol,
    };

    return [{ token: accessToken, user: userData }, null];
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return [null, "Error interno del servidor"];
  }
}

// Preguntar si se usará verificación por correo
export async function registerService(user) {
  try {
    const { nombre, apellidos, rut, email, password, rol, cargo } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    const existingEmailUser = await Usuario.findOne({ where: { email } });
    if (existingEmailUser) return [null, createErrorMessage("email", "Correo electrónico en uso")];

    const existingRutUser = await Usuario.findOne({ where: { rut } });
    if (existingRutUser) return [null, createErrorMessage("rut", "RUT ya asociado a una cuenta")];

    const verificationToken = jwt.sign(
      {
        nombre,
        apellidos,
        rut,
        email,
        rol,
        cargo,
        password: await encryptPassword(password),
      },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    // Preguntar si se enviará correo de verificación
    // await sendVerificationEmail(email, verificationToken);

    return [{ email, mensaje: "Correo de verificación enviado" }, null];
  } catch (error) {
    console.error("Error al registrar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function verifyEmailService(token) {
  try {
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return [null, "Token inválido o expirado"];
    }

    const existingUser = await Usuario.findOne({ where: { email: payload.email } });
    if (existingUser) return [null, "El correo electrónico ya está en uso"];

    const newUser = await Usuario.create({
      nombre: payload.nombre,
      apellidos: payload.apellidos,
      rut: payload.rut,
      email: payload.email,
      password: payload.password,
      rol: payload.rol || "cliente",
      cargo: payload.cargo || null,
    });

    return [newUser, null];
  } catch (error) {
    console.error("Error al verificar el correo electrónico:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function recoverPasswordService(token, newPassword) {
  try {
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return [null, "Token inválido o expirado"];
    }

    const user = await Usuario.findOne({ where: { email: payload.email } });

    if (!user) return [null, "Usuario no encontrado"];

    user.password = await encryptPassword(newPassword);
    await user.save();

    return [true, null];
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);
    return [null, "Error interno del servidor"];
  }
}