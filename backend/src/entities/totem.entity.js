import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Totem = sequelize.define('Totem', {
    id_totem: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID del tótem debe ser un número entero' },
            notNull: { msg: 'El ID del tótem es obligatorio' },
            notEmpty: { msg: 'El ID del tótem no puede estar vacío' },
        }
    },
    ubicacion: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notNull: { msg: 'La ubicación es obligatoria' },
            notEmpty: { msg: 'La ubicación no puede estar vacía' },
        }
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: {
                args: [0, 255],
                msg: 'La descripción no puede exceder los 255 caracteres'
            }
        }
    }
})

export default Totem;