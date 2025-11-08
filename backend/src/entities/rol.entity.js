import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Rol = sequelize.define('Rol', {
    id_rol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID del rol debe ser un número entero' },
            notNull: { msg: 'El ID del rol es obligatorio' },
            notEmpty: { msg: 'El ID del rol no puede estar vacío' },
        }
    },
    nombre_rol: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notNull: { msg: 'El nombre del rol es obligatorio' },
            notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
        }
    }
}) 

export default Rol;