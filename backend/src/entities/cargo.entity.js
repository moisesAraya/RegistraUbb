import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbconfig.js";

const Cargo = sequelize.define("Cargo", {
  id_cargo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nombre_cargo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  horas_trabajar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "Las horas a trabajar deben ser un número entero" },
      min: {
        args: [1],
        msg: "Las horas a trabajar deben ser al menos 1",
      },
      max: {
        args: [44],
        msg: "Las horas a trabajar no pueden exceder 44",
      },
    },
  },
}, {
  tableName: "Cargos",
  timestamps: false,
});

export default Cargo;
