'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const usuarios = [
      {
        rut_usuario: "13308258-1",
        nombres: "Tatiana Andrea",
        apellidos: "Gutierrez Bunster",
        email: "tgutierr@ubiobio.cl",
        password: await bcrypt.hash("82581", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "10399995-2",
        nombres: "Sergio Anibal",
        apellidos: "Araya Guzman",
        email: "saraya@ubiobio.cl",
        password: await bcrypt.hash("99952", 10),
        horas_atrabajar: 44,
        id_rol: 1,
        id_cargo: 2,
      },
    ];

    return queryInterface.bulkInsert('Usuarios', usuarios, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Usuarios', null, {});
  },
};
