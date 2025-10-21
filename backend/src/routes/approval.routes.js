import express from 'express';
import { 
    getPendingApprovals,
    approveRequest,
    rejectRequest 
} from '../controllers/approval.controller.js';
import { authenticateToken } from '../middlewares/authentication.middleware.js'; // ✅ Nombre correcto

const router = express.Router();

// Aplicar autenticación a todas las rutas de approval
router.use(authenticateToken);

// GET /api/approvals/pending - Obtener solicitudes pendientes de aprobación
router.get('/pending', getPendingApprovals);

// POST /api/approvals/:id/approve - Aprobar una solicitud
router.post('/:id/approve', approveRequest);

// POST /api/approvals/:id/reject - Rechazar una solicitud
router.post('/:id/reject', rejectRequest);

export default router;