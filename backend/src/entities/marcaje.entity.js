import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbconfig.js";

const Marcaje = sequelize.define(
  "Marcaje",
  {
    id_marcaje: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hora_ingreso: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_salida: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_totem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Totems',
        key: 'id_totem',
      },
    },
    rut_usuario: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: {
        model: 'Usuarios',
        key: 'rut_usuario',
      },
    },
  },
  {
    tableName: "Marcajes",
    timestamps: true, // ✅ HABILITAR TIMESTAMPS PORQUE LA TABLA LOS REQUIERE
  }
);

export default Marcaje;

console.log('✅ [MARCAJE-ENTITY] Modelo Marcaje definido correctamente');
