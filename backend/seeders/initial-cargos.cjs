'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Cargos", [
      { id_cargo: 1, nombre_cargo: "Docente universitario", horas_trabajar: 44 },
      { id_cargo: 2, nombre_cargo: "Encargado", horas_trabajar: 44 },
      { id_cargo: 3, nombre_cargo: "Secretaria", horas_trabajar: 44 },
      { id_cargo: 4, nombre_cargo: "Encargado de software", horas_trabajar: 44 },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Cargos", null, {});
  },
};
