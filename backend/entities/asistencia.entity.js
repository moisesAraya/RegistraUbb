import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/dbconfig.js';

const Asistencia = sequelize.define('Asistencia', {
    id_asist: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID de la asistencia debe ser un número entero' },
            notNull: { msg: 'El ID de la asistencia es obligatorio' },
            notEmpty: { msg: 'El ID de la asistencia no puede estar vacío' },
        }
    },
    colacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        validate: {
            notNull: { msg: 'El campo colación es obligatorio' },
            notEmpty: { msg: 'El campo colación no puede estar vacío' },
            isIn: {
                args: [[true, false]],
                msg: 'El campo colación debe ser true o false'
            }
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
    },
    horas_diarias: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            isFloat: { msg: 'Las horas diarias deben ser un número decimal' },
            notNull: { msg: 'Las horas diarias son obligatorias' },
            notEmpty: { msg: 'Las horas diarias no pueden estar vacías' },
            min: {
                args: [0],
                msg: 'Las horas diarias no pueden ser negativas'
            }
        }
    }
})

export default Asistencia;
