import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const QR = sequelize.define('QR', {
    codigo_unico: {
        type: DataTypes.TEXT,  // ✅ TEXT sin límite
        primaryKey: true,
        allowNull: false,
        unique: true,
        validate: {
            notNull: { msg: 'El código único es obligatorio' },
            notEmpty: { msg: 'El código único no puede estar vacío' },
            len: {
                args: [10, 10000],  // ✅ Hasta 10,000 caracteres
                msg: 'El código QR debe tener entre 10 y 10,000 caracteres'
            }
        }
    },
    estado_qr: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
            notNull: { msg: 'El estado del QR es obligatorio' },
            isIn: {
                args: [[true, false]],
                msg: 'El estado del QR debe ser true o false'
            }
        }
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
            notNull: { msg: 'La fecha de creación es obligatoria' },
            isDate: { msg: 'La fecha de creación debe ser una fecha válida' },
        }
    },
    rut_usuario: {
        type: DataTypes.STRING,
        allowNull: false,   
        references: {
            model: 'Usuarios', 
            key: 'rut_usuario',
        },
        validate: {
            notNull: { msg: 'El RUT del usuario es obligatorio' },
            notEmpty: { msg: 'El RUT del usuario no puede estar vacío' },
        }
    }
}, {
    tableName: 'QRs',
    timestamps: false
});

export default QR;

console.log('✅ [QR-ENTITY] Modelo QR configurado - SIN BORRAR DATOS');
