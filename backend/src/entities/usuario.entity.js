import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/dbconfig.js';

const Usuario = sequelize.define('Usuario', {
  rut_usuario: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    validate: {
        is: /^[0-9]{1,8}-[0-9kK]{1}$/,
        notNull: { msg: 'El RUT es obligatorio' },
        notEmpty: { msg: 'El RUT no puede estar vacío' },
    }
},
    nombres: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'Los nombres son obligatorios' },
            notEmpty: { msg: 'Los nombres no pueden estar vacíos' },
        }
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'Los apellidos son obligatorios' },
            notEmpty: { msg: 'Los apellidos no pueden estar vacíos' },
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'El correo electrónico no es válido' },
            notNull: { msg: 'El correo electrónico es obligatorio' },
            notEmpty: { msg: 'El correo electrónico no puede estar vacío' },
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: 'La contraseña es obligatoria' },
            notEmpty: { msg: 'La contraseña no puede estar vacía' },
        }
    },
    horas_atrabajar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'Las horas a trabajar deben ser un número entero' },
            min: {
                args: [1],
                msg: 'Las horas a trabajar deben ser al menos 1'
            },
            max: {
                args: [42],
                msg: 'Las horas a trabajar no pueden exceder 42'
            },
            notNull: { msg: 'Las horas a trabajar son obligatorias' },
        }
    },
    id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Rols',
            key: 'id_rol'
        },
        validate: {
            isInt: { msg: 'El ID del rol debe ser un número entero' },
            notNull: { msg: 'El ID del rol es obligatorio' },
            notEmpty: { msg: 'El ID del rol no puede estar vacío' },
        }
    }
}, {
    tableName: 'Usuarios',
    timestamps: false,
    
})

export default Usuario;
