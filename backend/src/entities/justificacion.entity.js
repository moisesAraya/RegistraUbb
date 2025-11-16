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
    fecha_justificacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    motivo: {
        type: DataTypes.STRING,
        allowNull: false,
        // Valores: 'congreso', 'charla', 'enfermedad', 'personal', 'otro'
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    es_justificada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
        // true = suma 8 horas (congreso, charla, enfermedad)
        // false = no suma horas (personal, otro)
    },
    horas_compensadas: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
        // 8.0 si es justificada, 0 si no lo es
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'REGISTRADA'
        // Solo un estado: REGISTRADA (no necesita aprobación)
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Justificacions',
    timestamps: false // ✅ DESACTIVAR TIMESTAMPS AUTOMÁTICOS
});

export default Justificacion;