import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Motivo = sequelize.define('Motivo', {
    id_motivo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID del motivo debe ser un número entero' },
            notNull: { msg: 'El ID del motivo es obligatorio' },
            notEmpty: { msg: 'El ID del motivo no puede estar vacío' },
        }
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'La descripción es obligatoria' },
            notEmpty: { msg: 'La descripción no puede estar vacía' },
        }
    },
    periodo: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            notNull: { msg: 'El periodo es obligatorio' },
            notEmpty: { msg: 'El periodo no puede estar vacío' },
        }
    },
   observaciones: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: {
                args: [0, 255],
                msg: 'Las observaciones no pueden exceder los 255 caracteres'
            }
        }
    },
    id_justificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Justificacions',
            key: 'id_justificacion',
        },
        validate: {
            isInt: { msg: 'El ID de la justificación debe ser un número entero' },  
            notNull: { msg: 'El ID de la justificación es obligatorio' },
            notEmpty: { msg: 'El ID de la justificación no puede estar vacío' },
        }
    }
})

export default Motivo;