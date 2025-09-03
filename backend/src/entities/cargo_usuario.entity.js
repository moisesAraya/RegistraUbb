import { Sequelize, DataTypes, Model } from "sequelize";
import { sequelize } from "../config/dbconfig.js";

const CargoUsuario = sequelize.define(
  "CargoUsuario",
  {
    id_cargo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "Cargos",
        key: "id_cargo",
      },
    },
    rut_usuario: {
      type: DataTypes.STRING, 
      allowNull: false,
      primaryKey: true,
      references: {
        model: "Usuarios",
        key: "rut_usuario",
      },
    },
  },
);

export default CargoUsuario;
