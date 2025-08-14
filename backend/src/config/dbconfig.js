import Sequelize from 'sequelize';

export const sequelize = new Sequelize(
    'RegistraUbb',
    'postgres',
    'holiwis',
    {
        host: 'localhost',
        dialect: 'postgres'
    }
);