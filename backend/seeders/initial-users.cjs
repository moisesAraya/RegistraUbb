"use strict";

const bcrypt = require("bcrypt");

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
      /* Profe Alejandro puede ser 14.371.917-0	o 
      12.264.363-8 , preguntar*/
      {
        rut_usuario: "14273436-2",
        nombres: "Alejanda Andrea",
        apellidos: "Segura Navarrete",
        email: "asegura@ubiobio.cl",
        password: await bcrypt.hash("34362", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "23735655-9",
        nombres: "Clemente",
        apellidos: "Rubio Manzano",
        email: "clrubio@ubiobio.cl",
        password: await bcrypt.hash("56559", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "12609906-1",
        nombres: "Christian Lautaro",
        apellidos: "Vidal Castro",
        email: "cvidal@ubiobio.cl",
        password: await bcrypt.hash("99061", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "12922969-1",
        nombres: "Mónica Alejandra",
        apellidos: "Caniupán Marileo",
        email: "mcaniupan@ubiobio.cl",
        password: await bcrypt.hash("29691", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "10708974-8",
        nombres: "Karina Pilar",
        apellidos: "Rojas Contreras",
        email: "krojas@ubiobio.cl",
        password: await bcrypt.hash("89748", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "17343933-4",
        nombres: "Luis Emilio",
        apellidos: "Cabrera Crot",
        email: "lcabrera@ubiobio.cl",
        password: await bcrypt.hash("39334", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "16012431-8",
        nombres: "Rodrigo Ariel",
        apellidos: "Torres Avilés",
        email: "rtorres@ubiobio.cl",
        password: await bcrypt.hash("24318", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },
      {
        rut_usuario: "8631998-5",
        nombres: "Juan Carlos",
        apellidos: "Parra Márquez",
        email: "jefecarrconce-icinf@ubiobio.cl",
        password: await bcrypt.hash("19985", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },


      /*{
        rut_usuario: "",
        nombres: "",
        apellidos: "",
        email: "",
        password: await bcrypt.hash("", 10),
        horas_atrabajar: 44,
        id_rol: 2,
        id_cargo: 1,
      },*/
      
    ];

    return queryInterface.bulkInsert("Usuarios", usuarios, {
      ignoreDuplicates: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Usuarios", null, {});
  },
};
