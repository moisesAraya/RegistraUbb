import User from "../entities/usuario.entity.js";
import {
handleErrorClient,
handleErrorServer,
} from "../handlers/responseHandlers.js";

export async function isAdmin(req, res, next) {
try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOneBy({ email: req.user.email });

    if (!userFound) {
    return handleErrorClient(
        res,
        404,
        "Usuario no encontrado en la base de datos",
    );
    }

    const rolUser = userFound.rol;

    if (rolUser !== "administrador") {
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
      const userRepository = AppDataSource.getRepository(User);
      // Permitir que el token tenga id_usuario o id
      const userId = req.user.id_usuario || req.user.id;
      if (!userId) {
        return handleErrorClient(
          res,
          401,
          "Token JWT sin id_usuario ni id"
        );
      }
      const userFound = await userRepository.findOneBy({ id_usuario: userId });
      if (!userFound) {
        return handleErrorClient(
          res,
          404,
          "Usuario no encontrado en la base de datos"
        );
      }
      if (!allowedRoles.includes(userFound.rol)) {
        return handleErrorClient(
          res,
          403,
          "Error al acceder al recurso",
          `Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`
        );
      }
      req.user.rol = userFound.rol;
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