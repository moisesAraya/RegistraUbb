import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const QR = sequelize.define('QR', {
    codigo_unico: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
        validate: {
            notNull: { msg: 'El código único es obligatorio' },
            notEmpty: { msg: 'El código único no puede estar vacío' },
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
    }
})

export default QR;
        