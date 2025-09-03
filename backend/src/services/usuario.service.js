"use strict";
import Usuario from "../entities/usuario.entity.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { Op } from "sequelize";

// Obtener usuario por rut, id o email
export async function getUserService(query) {
  try {
    const { rut, id, email } = query;

    const userFound = await Usuario.findOne({
      where: {
        [Op.or]: [
          rut ? { rut_usuario: rut } : {},
          id ? { id_usuario: id } : {},
          email ? { email: email } : {},
        ],
      },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound.get({ plain: true });

    return [userData, null];
  } catch (error) {
    console.error("Error obtener el usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Obtener todos los usuarios
export async function getUsersService() {
  try {
    const users = await Usuario.findAll();

    if (!users || users.length === 0) return [null, "No hay usuarios"];

    const usersData = users.map(user => {
      const { password, ...userData } = user.get({ plain: true });
      return userData;
    });

    return [usersData, null];
  } catch (error) {
    console.error("Error al obtener a los usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

// Crear usuario
export async function createUserService(userData) {
  try {
    // Verificar si ya existe un usuario con el mismo rut o email
    const existingUser = await Usuario.findOne({
      where: {
        [Op.or]: [
          { rut_usuario: userData.rut_usuario },
          { email: userData.email }
        ]
      }
    });

    if (existingUser) {
      return [null, "Ya existe un usuario con el mismo rut o email"];
    }

    // Encriptar la contraseña si se proporciona
    let encryptedPassword = null;
    if (userData.password && userData.password.trim() !== "") {
      encryptedPassword = await encryptPassword(userData.password);
    }

    // Preparar los datos del usuario
    const newUserData = {
      rut_usuario: userData.rut_usuario,
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      email: userData.email,
      password: encryptedPassword,
      horas_atrabajar: userData.horas_atrabajar,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Crear el usuario
    const newUser = await Usuario.create(newUserData);

    // Retornar sin la contraseña
    const { password, ...userCreated } = newUser.get({ plain: true });
    return [userCreated, null];
  } catch (error) {
    console.error("Error al crear un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Actualizar usuario
export async function updateUserService(query, body) {
  try {
    const { id, rut, email } = query;

    // Buscar usuario usando id_usuario, rut_usuario o email
    const userFound = await Usuario.findOne({
      where: {
        [Op.or]: [
          id ? { id_usuario: id } : {},
          rut ? { rut_usuario: rut } : {},
          email ? { email: email } : {},
        ],
      },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    // Verificar si ya existe otro usuario con el mismo rut o email
    if (body.rut_usuario || body.email) {
      const existingUser = await Usuario.findOne({
        where: {
          [Op.or]: [
            body.rut_usuario ? { rut_usuario: body.rut_usuario } : {},
            body.email ? { email: body.email } : {},
          ],
          id_usuario: { [Op.ne]: userFound.id_usuario }
        }
      });

      if (existingUser) {
        return [null, "Ya existe un usuario con el mismo rut o email"];
      }
    }

    // Verificar contraseña actual si se envía
    if (body.password) {
      const matchPassword = await comparePassword(
        body.password,
        userFound.password,
      );
      if (!matchPassword) return [null, "La contraseña no coincide"];
    }

    // Actualizar campos
    const dataUserUpdate = {
      nombres: body.nombres,
      apellidos: body.apellidos,
      rut_usuario: body.rut_usuario,
      email: body.email,
      horas_atrabajar: body.horas_atrabajar,
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== "") {
      dataUserUpdate.password = await encryptPassword(body.newPassword);
    }

    await userFound.update(dataUserUpdate);

    const { password, ...userUpdated } = userFound.get({ plain: true });

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al modificar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Eliminar usuario
export async function deleteUserService(query) {
  try {
    const { id, rut, email } = query;

    const userFound = await Usuario.findOne({
      where: {
        [Op.or]: [
          id ? { id_usuario: id } : {},
          rut ? { rut_usuario: rut } : {},
          email ? { email: email } : {},
        ],
      },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    // Si tienes un campo rol, puedes validar aquí
    // if (userFound.rol === "Administrador") {
    //   return [null, "No se puede eliminar un usuario con rol de administrador"];
    // }

    await userFound.destroy();

    const { password, ...dataUser } = userFound.get({ plain: true });

    return [dataUser, null];
  } catch (error) {
    console.error("Error al eliminar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Obtener perfil de usuario
export async function getProfileService(userId) {
  try {
    if (!userId) return [null, "ID de usuario no proporcionado"];

    const userFound = await Usuario.findOne({
      where: { id_usuario: userId },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound.get({ plain: true });

    return [userData, null];
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Actualizar perfil de usuario
export async function updateProfileService(userId, body) {
  try {
    if (!userId) return [null, "ID de usuario no proporcionado"];

    // Busca el usuario por su ID
    const userFound = await Usuario.findOne({
      where: { id_usuario: userId },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    // Verifica si ya existe otro usuario con el mismo rut o email
    if (body.rut_usuario || body.email) {
      const existingUser = await Usuario.findOne({
        where: {
          [Op.or]: [
            body.rut_usuario ? { rut_usuario: body.rut_usuario } : {},
            body.email ? { email: body.email } : {},
          ],
          id_usuario: { [Op.ne]: userFound.id_usuario }
        }
      });

      if (existingUser) {
        return [null, "Ya existe un usuario con el mismo rut o email"];
      }
    }

    // Verificar contraseña actual si se envía
    if (body.password) {
      const matchPassword = await comparePassword(
        body.password,
        userFound.password,
      );
      if (!matchPassword) return [null, "La contraseña no coincide"];
    }

    // Solo actualizar los campos que se están enviando
    const dataUserUpdate = {
      updatedAt: new Date(),
    };

    if (body.nombres !== undefined) dataUserUpdate.nombres = body.nombres;
    if (body.apellidos !== undefined) dataUserUpdate.apellidos = body.apellidos;
    if (body.email !== undefined) dataUserUpdate.email = body.email;
    if (body.rut_usuario !== undefined) dataUserUpdate.rut_usuario = body.rut_usuario;
    if (body.horas_atrabajar !== undefined) dataUserUpdate.horas_atrabajar = body.horas_atrabajar;

    if (body.newPassword && body.newPassword.trim() !== "") {
      dataUserUpdate.password = await encryptPassword(body.newPassword);
    }

    await userFound.update(dataUserUpdate);

    const { password, ...userUpdated } = userFound.get({ plain: true });
    return [userUpdated, null];
  } catch (error) {
    console.error("Error al modificar el perfil del usuario:", error);
    return [null, "Error interno del servidor"];
  }
}