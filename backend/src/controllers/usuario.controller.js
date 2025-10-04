"use strict";
import {
  deleteUserService,
  getUserService,
  getUsersService,
  createUserService,
  updateUserService,
  getProfileService,
  updateProfileService,
} from "../services/usuario.service.js";
import {
    userBodyValidation,
    userUpdateValidation,
} from "../validations/usuario.validations.js";

export async function getUserController(req, res) {
  const { id_usuario, rut, email } = req.query;
  const query = { id: id_usuario, rut, email };
  
  try {
    const [user, error] = await getUserService(query);
    if (error) {
      return res.status(404).json({
        success: false,
        message: error,
        data: null
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Usuario encontrado",
      data: user
    });
  } catch (error) {
    console.error("Error en getUserController:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }
}

export async function getUsersController(req, res) {
  try {
    console.log('getUsersController ejecutándose...');
    
    const [users, error] = await getUsersService();
    
    if (error) {
      console.log('Error del servicio:', error);
      return res.status(404).json({
        success: false,
        message: error,
        data: null
      });
    }

    console.log('Usuarios encontrados:', users?.length || 0);
    
    return res.status(200).json({
      success: true,
      message: "Usuarios encontrados",
      data: users || []
    });
  } catch (error) {
    console.error("Error en getUsersController:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }
}

export async function createUserController(req, res) {
  const userData = req.body;
  
  try {
    console.log('Creando usuario:', userData);
    
    const { error: validationError } = userBodyValidation.validate(userData);
    if (validationError) {
      console.log('Error de validación:', validationError.details[0].message);
      return res.status(400).json({
        success: false,
        message: validationError.details[0].message,
        data: null
      });
    }
    
    const [newUser, error] = await createUserService(userData);
    if (error) {
      console.log('Error del servicio:', error);
      return res.status(400).json({
        success: false,
        message: error,
        data: null
      });
    }
    
    console.log('Usuario creado exitosamente');
    return res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: newUser
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }   
}

export async function updateUserController(req, res) {
  const { rut_usuario } = req.params;
  let userData = req.body;  
  
  try {
    console.log('Actualizando usuario:', { rut_usuario, userData });
    
    // Filtrar campos que no se deben actualizar
    const { rut_usuario: _, createdAt, updatedAt, rol, cargo, ...cleanUserData } = userData;
    
    console.log('Datos limpios para actualizar:', cleanUserData);
    
    // Validar solo los datos que se pueden actualizar
    const { error: validationError } = userUpdateValidation.validate(cleanUserData);
    if (validationError) {
      console.log('Error de validación:', validationError.details[0].message);
      return res.status(400).json({
        success: false,
        message: validationError.details[0].message,
        data: null
      });
    }
    
    const [updatedUser, error] = await updateUserService(rut_usuario, cleanUserData);
    if (error) {
      console.log('Error del servicio:', error);
      return res.status(400).json({
        success: false,
        message: error,
        data: null
      });
    }
    
    console.log('Usuario actualizado exitosamente');
    return res.status(200).json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: updatedUser
    });
  }
  catch (error) {
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }
}

export async function deleteUserController(req, res) {
  const { rut_usuario } = req.params;
  
  try {
    console.log('Eliminando usuario:', rut_usuario);
    
    const error = await deleteUserService(rut_usuario);
    if (error) {
      console.log('Error del servicio:', error);
      return res.status(400).json({
        success: false,
        message: error,
        data: null
      });
    }
    
    console.log('Usuario eliminado exitosamente');
    return res.status(200).json({
      success: true,
      message: "Usuario eliminado exitosamente",
      data: null
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }
}

// Funciones adicionales para obtener roles y cargos desde la base de datos
export async function getRolesController(req, res) {
  try {
    console.log('Obteniendo roles desde la base de datos...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const { default: Rol } = await import('../entities/rol.entity.js');
    
    const roles = await Rol.findAll({
      attributes: ['id_rol', 'nombre_rol'],
      order: [['id_rol', 'ASC']]
    });

    console.log('Roles encontrados:', roles.length);
    
    return res.status(200).json({
      success: true,
      message: "Roles obtenidos exitosamente",
      data: roles
    });
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }
}

export async function getCargosController(req, res) {
  try {
    console.log('Obteniendo cargos desde la base de datos...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const { default: Cargo } = await import('../entities/cargo.entity.js');
    
    const cargos = await Cargo.findAll({
      attributes: ['id_cargo', 'nombre_cargo'],
      order: [['id_cargo', 'ASC']]
    });

    console.log('Cargos encontrados:', cargos.length);
    
    return res.status(200).json({
      success: true,
      message: "Cargos obtenidos exitosamente",
      data: cargos
    });
  } catch (error) {
    console.error("Error al obtener cargos:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      data: null
    });
  }
}