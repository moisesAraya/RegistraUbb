import Usuario from "../entities/usuario.entity.js";
import Rol from "../entities/rol.entity.js";
import {
handleErrorClient,
handleErrorServer,
} from "../handlers/responseHandlers.js";

export async function isAdmin(req, res, next) {
try {
    const userFound = await Usuario.findOne({ 
        where: { rut_usuario: req.user.rut_usuario },
        include: [{
            model: Rol,
            attributes: ['nombre_rol']
        }]
    });

    if (!userFound) {
    return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
    );
    }

    // Verificar si es administrador (id_rol = 4 o nombre_rol = 'administrador')
    const isUserAdmin = userFound.id_rol === 4 || 
                       (userFound.Rol && userFound.Rol.nombre_rol.toLowerCase() === 'administrador');

    if (!isUserAdmin) {
        return handleErrorClient(
            res,
            403,
            "Error al acceder al recurso",
            "Se requiere un rol de Administrador para realizar esta acción."
        );
    }
    next();
} catch (error) {
    handleErrorServer(
    res,
    500,
    error.message,
    );
}
}

// Este middleware permite verificar si el usuario tiene uno de los roles permitidos
export function authorizeRoles(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userFound = await Usuario.findOne({ 
        where: { rut_usuario: req.user.rut_usuario },
        include: [{
            model: Rol,
            attributes: ['nombre_rol']
        }]
      });
      
      if (!userFound) {
        return handleErrorClient(
          res,
          404,
          "Usuario no encontrado en la base de datos"
        );
      }
      
      const userRole = userFound.Rol ? userFound.Rol.nombre_rol.toLowerCase() : '';
      const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole);
      
      if (!hasPermission) {
        return handleErrorClient(
          res,
          403,
          "Error al acceder al recurso",
          `Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`
        );
      }
      
      req.user.rol = userRole;
      next();
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  };
}

// Middlewares específicos para roles diferenciados
export async function isFabrica(req, res, next) {
  return authorizeRoles(["fabrica"])(req, res, next);
}

export async function isTienda(req, res, next) {
  return authorizeRoles(["tienda"])(req, res, next);
}

export async function isFabricaOrAdmin(req, res, next) {
  return authorizeRoles(["fabrica", "administrador"])(req, res, next);
}

export async function isTiendaOrAdmin(req, res, next) {
  return authorizeRoles(["tienda", "administrador"])(req, res, next);
}

// Mantener compatibilidad con empleado (usar fabrica)
export async function isEmpleado(req, res, next) {
  return authorizeRoles(["fabrica"])(req, res, next);
}

export async function isEmpleadoOrAdmin(req, res, next) {
  return authorizeRoles(["fabrica", "administrador"])(req, res, next);
}