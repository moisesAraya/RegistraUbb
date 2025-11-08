import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Justificacion = sequelize.define('Justificacion', {
    id_justificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID de la justificación debe ser un número entero' },
            notNull: { msg: 'El ID de la justificación es obligatorio' },
            notEmpty: { msg: 'El ID de la justificación no puede estar vacío' },
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
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'El estado es obligatorio' },
            notEmpty: { msg: 'El estado no puede estar vacío' },
        }
    }
})

export default Justificacion;