import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Justificacion = sequelize.define('Justificacion', {
    id_justificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    rut_usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDIENTE'
    },
    fecha_justificacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // ⭐ Campos para el tracking de aprobaciones
    observaciones_admin: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    aprobado_por: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_aprobacion: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rechazado_por: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_rechazo: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'Justificacions',
    timestamps: true
});

export default Justificacion;