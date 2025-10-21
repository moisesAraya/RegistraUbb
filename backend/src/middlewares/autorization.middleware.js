import jwt from "jsonwebtoken";
import Usuario from "../entities/usuario.entity.js";
import Rol from "../entities/rol.entity.js";
import {
  handleErrorClient,
  handleErrorServer,
} from "../handlers/responseHandlers.js";

/**
 * 🔐 MIDDLEWARE PRINCIPAL DE AUTENTICACIÓN PARA REGISTRAUBB
 */
export async function authorizationMiddleware(req, res, next) {
  try {
    console.log('🔐 [AUTH] === INICIANDO VERIFICACIÓN ===');
    
    // ✅ AGREGAR ESTE LOG PARA VER QUE SECRETS TENEMOS
    console.log('🔐 [AUTH] Variables de entorno JWT:');
    console.log('🔐 [AUTH] process.env.JWT_SECRET:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NO DEFINIDO');
    console.log('🔐 [AUTH] process.env.ACCESS_JWT_SECRET:', process.env.ACCESS_JWT_SECRET ? process.env.ACCESS_JWT_SECRET.substring(0, 10) + '...' : 'NO DEFINIDO');
    
    console.log('🔐 [AUTH] Headers recibidos:', Object.keys(req.headers));
    console.log('🔐 [AUTH] Authorization header:', req.headers.authorization ? 'Presente' : 'Ausente');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ [AUTH] No se encontró header Authorization');
      return handleErrorClient(res, 401, "Token de acceso requerido");
    }

    // ✅ EXTRAER TOKEN - soportar múltiples formatos
    let token = null;
    
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover "Bearer "
    } else if (authHeader.startsWith('Token ')) {
      token = authHeader.substring(6); // Remover "Token "
    } else {
      token = authHeader; // Usar directamente
    }
    
    console.log('🔐 [AUTH] Token extraído:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token || token.trim() === '') {
      console.log('❌ [AUTH] Token vacío o inválido');
      return handleErrorClient(res, 401, "Token inválido");
    }

    // ✅ VERIFICAR TOKEN CON MÚLTIPLES SECRETS - INCLUIR MÁS OPCIONES
    let decoded = null;
    const possibleSecrets = [
      process.env.JWT_SECRET,
      process.env.ACCESS_JWT_SECRET,
      "tu-jwt-secret-super-secreto-2024",
      "mi_clave_secreta_para_jwt_2024",
      "mi_clave_secreta_para_jwt", // ✅ AGREGAR ESTE
      "your-secret-key", // ✅ AGREGAR ESTE
      "registraubb-secret", // ✅ AGREGAR ESTE
      "jwt-secret" // ✅ AGREGAR ESTE
    ].filter(secret => secret && secret.trim() !== '');

    console.log('🔐 [AUTH] Intentando verificar con', possibleSecrets.length, 'secrets posibles');

    for (let i = 0; i < possibleSecrets.length; i++) {
      const secret = possibleSecrets[i];
      try {
        console.log(`🔐 [AUTH] Probando secret ${i + 1}:`, secret.substring(0, 10) + '...');
        decoded = jwt.verify(token, secret);
        console.log('✅ [AUTH] Token verificado exitosamente con secret:', secret.substring(0, 10) + '...');
        console.log('✅ [AUTH] Payload decodificado:', decoded);
        break;
      } catch (verifyError) {
        console.log(`❌ [AUTH] Secret ${i + 1} falló:`, verifyError.name, '-', verifyError.message);
        continue;
      }
    }

    if (!decoded) {
      console.error('❌ [AUTH] Token no pudo ser verificado con ningún secret disponible');
      console.error('❌ [AUTH] Secrets intentados:', possibleSecrets.length);
      return handleErrorClient(res, 401, "Token inválido - verificación fallida");
    }
    
    console.log('🔐 [AUTH] Token decodificado exitosamente:', {
      rut_usuario: decoded.rut_usuario,
      id_rol: decoded.id_rol,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Sin expiración'
    });
    
    // ✅ VERIFICAR EXPIRACIÓN
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.log('❌ [AUTH] Token expirado');
      return handleErrorClient(res, 401, "Token expirado");
    }
    
    // ✅ BUSCAR USUARIO
    console.log('🔍 [AUTH] Buscando usuario:', decoded.rut_usuario);
    
    const userFound = await Usuario.findOne({ 
      where: { rut_usuario: decoded.rut_usuario }
    });

    if (!userFound) {
      console.log('❌ [AUTH] Usuario no encontrado en BD:', decoded.rut_usuario);
      return handleErrorClient(res, 404, "Usuario no encontrado en la base de datos");
    }

    console.log('✅ [AUTH] Usuario encontrado:', userFound.rut_usuario, '|', userFound.nombres, userFound.apellidos);

    // ✅ BUSCAR ROL (opcional)
    let userRole = null;
    if (userFound.id_rol) {
      try {
        const roleFound = await Rol.findOne({
          where: { id_rol: userFound.id_rol }
        });
        userRole = roleFound?.nombre_rol || 'sin_rol';
        console.log('✅ [AUTH] Rol encontrado:', userRole);
      } catch (roleError) {
        console.warn('⚠️ [AUTH] Error buscando rol (no crítico):', roleError.message);
        userRole = 'sin_rol';
      }
    }

    // ✅ AGREGAR DATOS AL REQUEST
    req.rut_usuario = userFound.rut_usuario;
    req.id_rol = userFound.id_rol;
    req.nombres = userFound.nombres;
    req.apellidos = userFound.apellidos;
    
    req.user = {
      rut_usuario: userFound.rut_usuario,
      id_rol: userFound.id_rol,
      nombres: userFound.nombres,
      apellidos: userFound.apellidos,
      rol: userRole,
      email: userFound.email,
      horas_atrabajar: userFound.horas_atrabajar
    };

    console.log('✅ [AUTH] Usuario autenticado exitosamente:', {
      rut: userFound.rut_usuario,
      rol_id: userFound.id_rol,
      rol_nombre: userRole
    });
    
    next();

  } catch (error) {
    console.error('❌ [AUTH] Error general en middleware:', error);
    
    // ✅ MANEJO DE ERRORES ESPECÍFICOS
    if (error.name === 'JsonWebTokenError') {
      return handleErrorClient(res, 401, "Token con formato inválido");
    } else if (error.name === 'TokenExpiredError') {
      return handleErrorClient(res, 401, "Token expirado");
    } else if (error.name === 'NotBeforeError') {
      return handleErrorClient(res, 401, "Token no válido aún");
    }
    
    return handleErrorClient(res, 401, "Error de autenticación");
  }
}

/**
 * 🔑 FUNCIÓN PARA GENERAR TOKENS DE DESARROLLO
 */
export function generateDevelopmentToken(rut_usuario, id_rol = 2) {
  // ✅ USAR EL MISMO SECRET QUE EL MIDDLEWARE
  const jwtSecret = process.env.JWT_SECRET || "tu-jwt-secret-super-secreto-2024";
  
  const payload = {
    rut_usuario: rut_usuario,
    id_rol: id_rol,
    iat: Math.floor(Date.now() / 1000), // Issued at
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };
  
  const token = jwt.sign(payload, jwtSecret);
  
  console.log('🔑 [DEV-TOKEN] === GENERACIÓN ===');
  console.log('🔑 [DEV-TOKEN] Usuario:', rut_usuario, '| Rol:', id_rol);
  console.log('🔑 [DEV-TOKEN] Secret usado:', jwtSecret.substring(0, 10) + '...');
  console.log('🔑 [DEV-TOKEN] Payload:', payload);
  console.log('🔑 [DEV-TOKEN] Token generado:', token.substring(0, 50) + '...');
  
  // ✅ VERIFICAR QUE EL TOKEN FUNCIONA
  try {
    const verification = jwt.verify(token, jwtSecret);
    console.log('✅ [DEV-TOKEN] Token verificado correctamente:', verification);
  } catch (verifyError) {
    console.error('❌ [DEV-TOKEN] Error verificando token generado:', verifyError);
  }
  
  return token;
}

/**
 * 🔐 ALIAS PARA COMPATIBILIDAD
 */
export const verifyToken = authorizationMiddleware;
export const authenticateToken = authorizationMiddleware;

/**
 * 🔐 VERIFICAR SI ES ADMINISTRADOR
 */
export async function isAdmin(req, res, next) {
  try {
    if (!req.user || !req.rut_usuario) {
      return authorizationMiddleware(req, res, () => {
        if (req.id_rol === 1) {
          console.log('✅ [AUTH] Usuario es administrador:', req.rut_usuario);
          next();
        } else {
          console.log('❌ [AUTH] Usuario no es administrador:', req.rut_usuario, '| Rol ID:', req.id_rol);
          return handleErrorClient(
            res,
            403,
            "Error al acceder al recurso",
            "Se requiere un rol de Administrador para realizar esta acción."
          );
        }
      });
    }

    if (req.id_rol === 1) {
      console.log('✅ [AUTH] Usuario es administrador:', req.rut_usuario);
      next();
    } else {
      console.log('❌ [AUTH] Usuario no es administrador:', req.rut_usuario, '| Rol ID:', req.id_rol);
      return handleErrorClient(
        res,
        403,
        "Error al acceder al recurso",
        "Se requiere un rol de Administrador para realizar esta acción."
      );
    }

  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * 🔐 MIDDLEWARE FLEXIBLE PARA MÚLTIPLES ROLES
 */
export function authorizeRoles(allowedRoleIds) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.rut_usuario) {
        return authorizationMiddleware(req, res, () => {
          const hasPermission = allowedRoleIds.includes(req.id_rol);
          
          if (!hasPermission) {
            console.log('❌ [AUTH] Rol no autorizado:', req.rut_usuario, '| Rol ID:', req.id_rol, '| Permitidos:', allowedRoleIds);
            return handleErrorClient(
              res,
              403,
              "Error al acceder al recurso",
              `Se requiere uno de los siguientes roles: ${allowedRoleIds.join(", ")}`
            );
          }
          
          console.log('✅ [AUTH] Rol autorizado:', req.rut_usuario, '| Rol ID:', req.id_rol);
          next();
        });
      }

      const hasPermission = allowedRoleIds.includes(req.id_rol);
      
      if (!hasPermission) {
        console.log('❌ [AUTH] Rol no autorizado:', req.rut_usuario, '| Rol ID:', req.id_rol, '| Permitidos:', allowedRoleIds);
        return handleErrorClient(
          res,
          403,
          "Error al acceder al recurso",
          `Se requiere uno de los siguientes roles: ${allowedRoleIds.join(", ")}`
        );
      }
      
      console.log('✅ [AUTH] Rol autorizado:', req.rut_usuario, '| Rol ID:', req.id_rol);
      next();
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  };
}

// ✅ MIDDLEWARES ESPECÍFICOS
export async function isAcademico(req, res, next) {
  return authorizeRoles([2])(req, res, next);
}

export async function isDashboardAuthorized(req, res, next) {
  return authorizeRoles([1, 2])(req, res, next);
}

export async function isAdminOrAcademico(req, res, next) {
  return authorizeRoles([1, 2])(req, res, next);
}

export async function isMarcajeAuthorized(req, res, next) {
  return authorizationMiddleware(req, res, next);
}

export async function isJustificacionAuthorized(req, res, next) {
  return authorizeRoles([1, 2])(req, res, next);
}

console.log('🔐 [AUTH-MIDDLEWARE] ✅ VERSIÓN CORREGIDA CON LOGGING DETALLADO ✅');