import Justificacion from '../entities/justificacion.entity.js';
import Usuario from '../entities/usuario.entity.js';
import { sequelize } from '../config/dbconfig.js';

// Obtener todas las solicitudes pendientes de aprobación
export const getPendingApprovalsService = async () => {
    try {
        const pendingJustifications = await Justificacion.findAll({
            where: { estado: 'PENDIENTE' },
            include: [
                {
                    model: Usuario,
                    attributes: ['nombres', 'apellidos'],
                    as: 'usuario'
                }
            ]
        });

        // Formatear datos para el frontend
        const approvals = pendingJustifications.map(record => ({
            id: `just_${record.id_justificacion}_${record.rut_usuario}`,
            type: 'justification',
            userId: record.rut_usuario,
            userName: record.usuario ? `${record.usuario.nombres} ${record.usuario.apellidos}` : '',
            date: record.fecha_justificacion,
            submittedAt: record.createdAt || record.fecha_justificacion,
            reason: record.descripcion
        }));

        // Ordenar por fecha de envío (más recientes primero)
        approvals.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        return [approvals, null];
    } catch (error) {
        console.error('Error obteniendo solicitudes pendientes:', error);
        return [null, 'Error al obtener las solicitudes pendientes'];
    }
};

// Aprobar una solicitud
export const approveRequestService = async (requestId, adminRut, reviewNotes = '') => {
    const transaction = await sequelize.transaction();
    
    try {
        const [type, id, userRut] = requestId.split('_');
        
        if (type !== 'just') {
            await transaction.rollback();
            return [null, 'Tipo de solicitud no válido'];
        }

        // Aprobar justificación
        await Justificacion.update(
            { 
                estado: 'APROBADO',
                observaciones_admin: reviewNotes,
                aprobado_por: adminRut,
                fecha_aprobacion: new Date()
            },
            { 
                where: { id_justificacion: id },
                transaction
            }
        );

        await transaction.commit();
        return [{ message: 'Solicitud aprobada exitosamente' }, null];
    } catch (error) {
        await transaction.rollback();
        console.error('Error aprobando solicitud:', error);
        return [null, 'Error al aprobar la solicitud'];
    }
};

// Rechazar una solicitud
export const rejectRequestService = async (requestId, adminRut, reviewNotes) => {
    const transaction = await sequelize.transaction();
    
    try {
        const [type, id, userRut] = requestId.split('_');
        
        if (type !== 'just') {
            await transaction.rollback();
            return [null, 'Tipo de solicitud no válido'];
        }

        // Rechazar justificación
        await Justificacion.update(
            { 
                estado: 'RECHAZADO',
                observaciones_admin: reviewNotes,
                rechazado_por: adminRut,
                fecha_rechazo: new Date()
            },
            { 
                where: { id_justificacion: id },
                transaction
            }
        );

        await transaction.commit();
        return [{ message: 'Solicitud rechazada exitosamente' }, null];
    } catch (error) {
        await transaction.rollback();
        console.error('Error rechazando solicitud:', error);
        return [null, 'Error al rechazar la solicitud'];
    }
};