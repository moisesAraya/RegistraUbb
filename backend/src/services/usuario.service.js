"use strict";
import Usuario from "../entities/usuario.entity.js";
import Rol from "../entities/rol.entity.js";
import Cargo from "../entities/cargo.entity.js";
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
          id ? { rut_usuario: id } : {},
          email ? { email: email } : {},
        ],
      },
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
      ],
      attributes: { exclude: ['password'] }
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const userData = userFound.get({ plain: true });
    return [userData, null];
  } catch (error) {
    console.error("Error obtener el usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Obtener todos los usuarios
export async function getUsersService() {
  try {
    console.log('🔍 Ejecutando getUsersService...');
    
    const users = await Usuario.findAll({
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
      ],
      attributes: { exclude: ['password'] }
    });

    console.log('📊 Usuarios encontrados en DB:', users?.length || 0);

    if (!users || users.length === 0) {
      console.log('⚠️ No hay usuarios en la base de datos');
      return [[], null];
    }

    const usersData = users.map(user => user.get({ plain: true }));
    
    console.log('✅ Usuarios procesados:', usersData.length);
    
    return [usersData, null];
  } catch (error) {
    console.error("💥 Error al obtener usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

// Crear usuario
export async function createUserService(userData) {
  try {
    console.log('🆕 Creando usuario:', userData);

    // Verificar si ya existe un usuario con ese RUT o email
    const existingUser = await Usuario.findOne({
      where: {
        [Op.or]: [
          { rut_usuario: userData.rut_usuario },
          { email: userData.email }
        ]
      }
    });

    if (existingUser) {
      return [null, "Ya existe un usuario con ese RUT o email"];
    }

    // Encriptar la contraseña
    const hashedPassword = await encryptPassword(userData.password);

    // Crear el usuario
    const newUser = await Usuario.create({
      ...userData,
      password: hashedPassword
    });

    // Obtener el usuario creado with relaciones
    const createdUser = await Usuario.findOne({
      where: { rut_usuario: newUser.rut_usuario },
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
      ],
      attributes: { exclude: ['password'] }
    });

    const userDataResponse = createdUser.get({ plain: true });
    
    console.log('✅ Usuario creado exitosamente');
    return [userDataResponse, null];
  } catch (error) {
    console.error("💥 Error al crear usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Actualizar usuario
export async function updateUserService(rut_usuario, userData) {
  try {
    console.log('🔍 Actualizando usuario:', rut_usuario, userData);
    
    const user = await Usuario.findOne({ 
      where: { rut_usuario: rut_usuario }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', rut_usuario);
      return [null, "Usuario no encontrado"];
    }

    // Si hay password, encriptarla
    if (userData.password) {
      userData.password = await encryptPassword(userData.password);
    }

    // Actualizar el usuario
    await user.update(userData);
    
    // Obtener el usuario actualizado with relaciones
    const updatedUser = await Usuario.findOne({
      where: { rut_usuario: rut_usuario },
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
      ],
      attributes: { exclude: ['password'] }
    });

    const userDataResponse = updatedUser.get({ plain: true });
    
    console.log('✅ Usuario actualizado exitosamente');
    return [userDataResponse, null];
  } catch (error) {
    console.error("💥 Error al actualizar usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

// Eliminar usuario
export async function deleteUserService(rut_usuario) {
  try {
    console.log('🗑️ Eliminando usuario:', rut_usuario);
    
    const user = await Usuario.findOne({ 
      where: { rut_usuario: rut_usuario }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', rut_usuario);
      return "Usuario no encontrado";
    }

    await user.destroy();
    
    console.log('✅ Usuario eliminado exitosamente');
    return null;
  } catch (error) {
    console.error("💥 Error al eliminar usuario:", error);
    return "Error interno del servidor";
  }
}

// Obtener perfil de usuario
export async function getProfileService(rut_usuario) {
  try {
    const user = await Usuario.findOne({
      where: { rut_usuario: rut_usuario },
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
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) return [null, "Usuario no encontrado"];

    const userData = user.get({ plain: true });
    return [userData, null];
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return [null, "Error interno del servidor"];
  }
}

// Actualizar perfil de usuario
export async function updateProfileService(rut_usuario, userData) {
  try {
    const user = await Usuario.findOne({ 
      where: { rut_usuario: rut_usuario }
    });
    
    if (!user) return [null, "Usuario no encontrado"];

    if (userData.password) {
      userData.password = await encryptPassword(userData.password);
    }

    await user.update(userData);
    
    const updatedUser = await Usuario.findOne({
      where: { rut_usuario: rut_usuario },
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
      ],
      attributes: { exclude: ['password'] }
    });

    const userDataResponse = updatedUser.get({ plain: true });
    return [userDataResponse, null];
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return [null, "Error interno del servidor"];
  }
}