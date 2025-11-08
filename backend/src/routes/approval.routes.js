import { Router } from 'express';
import { 
    getPendingApprovals,
    approveRequest,
    rejectRequest
} from '../controllers/approval.controller.js';
import { authenticateJwtWithTokenService } from '../middlewares/authentication.middleware.js';
import { isAdmin } from '../middlewares/autorization.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación y permisos de admin
router.use(authenticateJwtWithTokenService);
router.use(isAdmin);

// GET /api/approvals/pending - Obtener solicitudes pendientes de aprobación
router.get('/pending', getPendingApprovals);

// POST /api/approvals/:id/approve - Aprobar una solicitud
router.post('/:id/approve', approveRequest);

// POST /api/approvals/:id/reject - Rechazar una solicitud
router.post('/:id/reject', rejectRequest);

export default router;