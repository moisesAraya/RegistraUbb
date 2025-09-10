'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    await queryInterface.bulkInsert("Rols", [
      { id_rol: 1, nombre_rol: "Administrador", createdAt: now, updatedAt: now },
      { id_rol: 2, nombre_rol: "Académico", createdAt: now, updatedAt: now },
      { id_rol: 3, nombre_rol: "Desarrollador", createdAt: now, updatedAt: now },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Rols", null, {});
  },
};
