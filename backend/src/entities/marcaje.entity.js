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
      type: DataTypes.DATE,
      allowNull: false,
    },
    hora_salida: {
      type: DataTypes.DATE,
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
      allowNull: true, // 👈 puede ser null en marcaje manual
      references: {
        model: "Totems",
        key: "id_totem",
      },
    },
    // 👇 ESTE CAMPO ES CLAVE, LA BD LO PIDE COMO NOT NULL
    rut_usuario: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
  },
  {
    tableName: "Marcajes",
    timestamps: true, // createdAt / updatedAt
  }
);

export default Marcaje;

console.log("✅ [MARCAJE-ENTITY] Modelo Marcaje definido correctamente");
