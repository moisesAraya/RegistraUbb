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
} from "../validations/usuario.validations.js";
import {
    handleErrorClient,
    handleErrorServer,
    handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getUserController(req, res) {
  const { id_usuario, rut, email } = req.query;
    const query = { id: id_usuario, rut, email };
    try {
        const [user, error] = await getUserService(query);
        if (error) return handleErrorClient(res, 404, error);
        return handleSuccess(res, 200, "Usuario encontrado", user);
    } catch (error) {
        console.error("Error en getUserController:", error);
        return handleErrorServer(res, 500, "Error interno del servidor");
    }
}
export async function getUsersController(req, res) {
    try {
        const [users, error] = await getUsersService();
        if (error) return handleErrorClient(res, 404, error);
        return handleSuccess(res, 200, "Usuarios encontrados", users);
    } catch (error) {
        console.error("Error en getUsersController:", error);
        return handleErrorServer(res, 500, "Error interno del servidor");
    }
}

export async function createUserController(req, res) {
    const userData = req.body;
    try {
        const [newUser, error] = await createUserService(userData);
        if (error) return handleErrorClient(res, 400, error);
        return handleSuccess(res, 201, "Usuario creado exitosamente", newUser);
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return handleErrorServer(res, 500, "Error interno del servidor");
    }   
}

export async function updateUserController(req, res) {
    const { id_usuario } = req.params;
    const userData = req.body;  
    try {
        const { error: validationError } = userBodyValidation.validate(userData);
        if (validationError) {
            return handleErrorClient(res, 400, validationError.details[0].message);
        }
        const [updatedUser, error] = await updateUserService(id_usuario, userData);
        if (error) return handleErrorClient(res, 400, error);
        return handleSuccess(res, 200, "Usuario actualizado exitosamente", updatedUser);
    }
    catch (error) {
        console.error("Error al actualizar usuario:", error);
        return handleErrorServer(res, 500, "Error interno del servidor");
    }
}

export async function deleteUserController(req, res) {
    const { id_usuario } = req.params;
    try {
        const error = await deleteUserService(id_usuario);
        if (error) return handleErrorClient(res, 400, error);
        return handleSuccess(res, 200, "Usuario eliminado exitosamente");
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        return handleErrorServer(res, 500, "Error interno del servidor");
    }
}
