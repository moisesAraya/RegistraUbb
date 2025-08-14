import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Marcaje = sequelize.define('Marcaje', {
    id_marcaje: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID del marcaje debe ser un número entero' },
            notNull: { msg: 'El ID del marcaje es obligatorio' },
            notEmpty: { msg: 'El ID del marcaje no puede estar vacío' },
        }
    },
    hora_ingreso: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notNull: { msg: 'La hora de ingreso es obligatoria' },
            isDate: { msg: 'La hora de ingreso debe ser una fecha válida' },
        }
    },
    hora_salida: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: { msg: 'La hora de salida debe ser una fecha válida' },
        }
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notNull: { msg: 'La fecha es obligatoria' },
            isDate: { msg: 'La fecha debe ser una fecha válida' },
        }
    },
    observacion: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: {
                args: [0, 255],
                msg: 'La observación no puede exceder los 255 caracteres'
            }
        }
    }
})

export default Marcaje;
    