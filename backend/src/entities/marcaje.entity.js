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
  },
  {
    tableName: "Marcajes",
    timestamps: false, // ✅ DESACTIVAR TIMESTAMPS AUTOMÁTICOS
  }
);

export default Marcaje;

console.log('✅ [MARCAJE-ENTITY] Modelo Marcaje definido correctamente');
