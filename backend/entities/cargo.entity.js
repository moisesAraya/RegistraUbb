import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/dbconfig.js';

const Cargo = sequelize.define('Cargo', {
    id_cargo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        validate: {
            isInt: { msg: 'El ID del cargo debe ser un número entero' },
            notNull: { msg: 'El ID del cargo es obligatorio' },
            notEmpty: { msg: 'El ID del cargo no puede estar vacío' },
        }
    },
    nombre_cargo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notNull: { msg: 'El nombre del cargo es obligatorio' },
            notEmpty: { msg: 'El nombre del cargo no puede estar vacío' },
        }
    },
    horas_trabajar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'Las horas a trabajar deben ser un número entero' },
            min: {
                args: [1],
                msg: 'Las horas a trabajar deben ser al menos 1'
            },
            max: {
                args: [24],
                msg: 'Las horas a trabajar no pueden exceder 24'
            },
            notNull: { msg: 'Las horas a trabajar son obligatorias' },
            notEmpty: { msg: 'Las horas a trabajar no pueden estar vacías' },
        }
    }
})

export default Cargo;    