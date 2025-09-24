import RegistroJust from '../entities/registro_just.entity.js';
import RegistroMarcaje from '../entities/registro_marcaje.entity.js';
import Justificacion from '../entities/justificacion.entity.js';
import Marcaje from '../entities/marcaje.entity.js';
import Usuario from '../entities/usuario.entity.js';
import { sequelize } from '../config/dbconfig.js';

// Obtener todas las solicitudes pendientes de aprobación
export const getPendingApprovalsService = async () => {
    try {
        // Obtener justificaciones pendientes
        const pendingJustifications = await RegistroJust.findAll({
            include: [
                {
                    model: Justificacion,
                    where: { estado: 'PENDIENTE' }
                },
                {
                    model: Usuario,
                    attributes: ['nombre', 'apellido']
                }
            ]
        });

        // Obtener registros manuales pendientes
        const pendingManualRecords = await RegistroMarcaje.findAll({
            include: [
                {
                    model: Marcaje,
                    where: { estado: 'PENDIENTE' }
                },
                {
                    model: Usuario,
                    attributes: ['nombre', 'apellido']
                }
            ]
        });

        // Formatear datos para el frontend
        const approvals = [];

        // Formatear justificaciones
        pendingJustifications.forEach(record => {
            approvals.push({
                id: `just_${record.id_justificacion}_${record.rut_usuario}`,
                type: 'justification',
                userId: record.rut_usuario,
                userName: `${record.Usuario.nombre} ${record.Usuario.apellido}`,
                date: record.fecha_registro,
                submittedAt: record.createdAt || record.fecha_registro,
                reason: record.Justificacion.descripcion
            });
        });

        // Formatear registros manuales
        pendingManualRecords.forEach(record => {
            approvals.push({
                id: `marcaje_${record.id_marcaje}_${record.rut_usuario}`,
                type: 'manual_attendance',
                userId: record.rut_usuario,
                userName: `${record.Usuario.nombre} ${record.Usuario.apellido}`,
                date: record.fecha_registro,
                submittedAt: record.createdAt || record.fecha_registro,
                reason: record.Marcaje.observaciones || 'Registro manual de asistencia',
                details: {
                    checkInTime: record.Marcaje.hora_entrada,
                    checkOutTime: record.Marcaje.hora_salida,
                    location: `Tótem ${record.id_totem}`,
                    notes: record.Marcaje.observaciones
                }
            });
        });

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
        
        if (type === 'just') {
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
        } else if (type === 'marcaje') {
            // Aprobar registro manual
            await Marcaje.update(
                { 
                    estado: 'APROBADO',
                    observaciones_admin: reviewNotes,
                    aprobado_por: adminRut,
                    fecha_aprobacion: new Date()
                },
                { 
                    where: { id_marcaje: id },
                    transaction
                }
            );
        } else {
            await transaction.rollback();
            return [null, 'Tipo de solicitud no válido'];
        }

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
        
        if (type === 'just') {
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
        } else if (type === 'marcaje') {
            // Rechazar registro manual
            await Marcaje.update(
                { 
                    estado: 'RECHAZADO',
                    observaciones_admin: reviewNotes,
                    rechazado_por: adminRut,
                    fecha_rechazo: new Date()
                },
                { 
                    where: { id_marcaje: id },
                    transaction
                }
            );
        } else {
            await transaction.rollback();
            return [null, 'Tipo de solicitud no válido'];
        }

        await transaction.commit();
        return [{ message: 'Solicitud rechazada exitosamente' }, null];
    } catch (error) {
        await transaction.rollback();
        console.error('Error rechazando solicitud:', error);
        return [null, 'Error al rechazar la solicitud'];
    }
};