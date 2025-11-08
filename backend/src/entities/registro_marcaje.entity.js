import { Sequelize, DataTypes, Model } from "sequelize";
import { sequelize } from "../config/dbconfig.js";

const RegistroMarcaje = sequelize.define( "RegistroMarcaje", {
  rut_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    references: {
        model: "Usuarios", 
        key: "rut_usuario",
    },
    },
    id_marcaje: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: "Marcajes", 
            key: "id_marcaje",
        },
    },
    id_totem: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: "Totems", 
            key: "id_totem",
        },
    },
    fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: 'La fecha de registro debe ser una fecha válida' },  
            notNull: { msg: 'La fecha de registro es obligatoria' },
            notEmpty: { msg: 'La fecha de registro no puede estar vacía' },
        }
    },
}, 
{
    tableName: "RegistroMarcaje",
    timestamps: false,
}
);      
export default RegistroMarcaje;