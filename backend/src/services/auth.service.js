"use strict";
import Usuario from "../entities/usuario.entity.js";
import Rol from "../entities/rol.entity.js";
import Cargo from "../entities/cargo.entity.js";
import jwt from "jsonwebtoken";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { JWT_SECRET } from "../config/envconfig.js";
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

    // ✅ Usando los alias correctos: 'rol' y 'cargo'
    const userFound = await Usuario.findOne({ 
      where: { email: email.trim().toLowerCase() },
      include: [
        {
          model: Rol,
          as: 'rol', // 👈 Alias correcto
          attributes: ['id_rol', 'nombre_rol']
        },
        {
          model: Cargo,
          as: 'cargo', // 👈 Alias correcto
          attributes: ['id_cargo', 'nombre_cargo']
        }
      ]
    });

    if (!userFound) {
      return [null, createErrorMessage("email", "El email es incorrecto")];
    }

    const isMatch = await comparePassword(password, userFound.password);

    if (!isMatch) {
      return [null, createErrorMessage("password", "La contraseña es incorrecta")];
    }

    const payload = {
      rut_usuario: userFound.rut_usuario,
      nombres: userFound.nombres,
      apellidos: userFound.apellidos,
      email: userFound.email,
      id_rol: userFound.id_rol,
      id_cargo: userFound.id_cargo,
    };

    const accessToken = TokenService.generateToken(payload);

    // ✅ userData con las relaciones usando los alias correctos
    const userData = {
      rut_usuario: userFound.rut_usuario,
      nombres: userFound.nombres,
      apellidos: userFound.apellidos,
      email: userFound.email,
      horas_atrabajar: userFound.horas_atrabajar,
      id_rol: userFound.id_rol,
      id_cargo: userFound.id_cargo,
      rol: userFound.rol,     // 👈 Alias 'rol' (minúscula)
      cargo: userFound.cargo  // 👈 Alias 'cargo' (minúscula)
    };

    return [{ token: accessToken, user: userData }, null];
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function registerService(user) {
  try {
    const { rut_usuario, nombres, apellidos, email, password, horas_atrabajar, id_rol, id_cargo } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    const existingEmailUser = await Usuario.findOne({ where: { email } });
    if (existingEmailUser) return [null, createErrorMessage("email", "Correo electrónico en uso")];

    const existingRutUser = await Usuario.findOne({ where: { rut_usuario } });
    if (existingRutUser) return [null, createErrorMessage("rut_usuario", "RUT ya asociado a una cuenta")];

    const verificationToken = jwt.sign(
      {
        rut_usuario,
        nombres,
        apellidos,
        email,
        horas_atrabajar,
        id_rol,
        id_cargo,
        password: await encryptPassword(password),
      },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

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
      rut_usuario: payload.rut_usuario,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      email: payload.email,
      password: payload.password,
      horas_atrabajar: payload.horas_atrabajar,
      id_rol: payload.id_rol || 2,
      id_cargo: payload.id_cargo || 1,
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