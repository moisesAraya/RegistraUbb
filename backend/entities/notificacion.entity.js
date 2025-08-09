import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/dbconfig.js';

const Notificacion = sequelize.define('Notificacion', {
    id_alerta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID de la alerta debe ser un número entero' },
            notNull: { msg: 'El ID de la alerta es obligatorio' },
            notEmpty: { msg: 'El ID de la alerta no puede estar vacío' },
        }
    },
    aviso: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'El aviso es obligatorio' },
            notEmpty: { msg: 'El aviso no puede estar vacío' },
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
})

export default Notificacion;