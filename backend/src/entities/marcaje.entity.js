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
<<<<<<< HEAD
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
=======
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
>>>>>>> d507211fdafab25cd2047ae7d4ce45c0916a34ee
    },
  },
  {
    tableName: "Marcajes",
<<<<<<< HEAD
    timestamps: true, // createdAt / updatedAt
=======
    timestamps: true, // ✅ HABILITAR TIMESTAMPS PORQUE LA TABLA LOS REQUIERE
>>>>>>> d507211fdafab25cd2047ae7d4ce45c0916a34ee
  }
);

export default Marcaje;

console.log("✅ [MARCAJE-ENTITY] Modelo Marcaje definido correctamente");
