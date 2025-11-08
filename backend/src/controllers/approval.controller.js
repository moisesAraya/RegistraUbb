import { 
    getPendingApprovalsService,
    approveRequestService,
    rejectRequestService 
} from '../services/approval.service.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../handlers/responseHandlers.js';

// Obtener todas las solicitudes pendientes de aprobación
export const getPendingApprovals = async (req, res) => {
    try {
        const [pendingApprovals, error] = await getPendingApprovalsService();
        
        if (error) {
            return handleErrorClient(res, 400, error);
        }

        return handleSuccess(res, 200, "Solicitudes pendientes obtenidas exitosamente", pendingApprovals);
    } catch (error) {
        return handleErrorServer(res, 500, error.message);
    }
};

// Aprobar una solicitud
export const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;
        const adminRut = req.user.rut_usuario; // Del token JWT

        const [result, error] = await approveRequestService(id, adminRut, reviewNotes);
        
        if (error) {
            return handleErrorClient(res, 400, error);
        }

        return handleSuccess(res, 200, "Solicitud aprobada exitosamente", result);
    } catch (error) {
        return handleErrorServer(res, 500, error.message);
    }
};

// Rechazar una solicitud
export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;
        const adminRut = req.user.rut_usuario; // Del token JWT

        if (!reviewNotes || reviewNotes.trim() === '') {
            return handleErrorClient(res, 400, "Las observaciones son obligatorias para rechazar una solicitud");
        }

        const [result, error] = await rejectRequestService(id, adminRut, reviewNotes);
        
        if (error) {
            return handleErrorClient(res, 400, error);
        }

        return handleSuccess(res, 200, "Solicitud rechazada exitosamente", result);
    } catch (error) {
        return handleErrorServer(res, 500, error.message);
    }
};