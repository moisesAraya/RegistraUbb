import { Sequelize, DataTypes, Model } from "sequelize";
import { sequelize } from "../config/dbconfig.js";

const RegistroJust = sequelize.define( "RegistroJust", {
  rut_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    references: {
        model: "Usuarios", // <-- debe coincidir con el nombre de la tabla de usuario
        key: "rut_usuario",
    },
  },
    id_justificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: "Justificacions", // <-- debe coincidir con el nombre de la tabla de justificacion
            key: "id_justificacion",
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
    tableName: "RegistroJust",
    timestamps: false,
}
);      
export default RegistroJust;