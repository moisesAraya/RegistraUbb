import app from './app.js';
import { sequelize } from './config/dbconfig.js';
import { setupRelations } from './entities/relations.js'; 
import https from "https";
import fs from "fs";

import Rol from './entities/rol.entity.js';
import Cargo from './entities/cargo.entity.js';
import Usuario from './entities/usuario.entity.js';
import QR from './entities/qr.entity.js';
import Totem from './entities/totem.entity.js';
import Motivo from './entities/motivo.entity.js';
import Marcaje from './entities/marcaje.entity.js';
import Asistencia from './entities/asistencia.entity.js';
import Justificacion from './entities/justificacion.entity.js';
import Notificacion from './entities/notificacion.entity.js';
import RegistroMarcaje from './entities/registro_marcaje.entity.js';

async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida correctamente.');

        console.log('🔧 Configurando relaciones...');
        setupRelations();

        console.log('📋 Sincronizando tablas...');
        await Rol.sync();
        await Cargo.sync();
        await Usuario.sync();
        await QR.sync();
        await Totem.sync();
        await Justificacion.sync();
        await Marcaje.sync();
        await Asistencia.sync();
        await Motivo.sync();
        await RegistroMarcaje.sync();
        await Notificacion.sync();

        console.log('🎉 Todas las tablas fueron sincronizadas correctamente.');
    } catch (error) {
        console.error('❌ Error al conectar o sincronizar la base de datos:');
        console.error(error.message);
    }
}

function startServer() {
    const options = {
        key: fs.readFileSync("/etc/ssl/registraubb/server.key"),
        cert: fs.readFileSync("/etc/ssl/registraubb/server.crt"),
    };

    https.createServer(options, app).listen(8080, "0.0.0.0", () => {
        console.log("🔐 Certificados cargados desde /etc/ssl/registraubb/");
        console.log("🚀 Servidor HTTPS activo en https://146.83.194.142:1772");
    });
}

async function main() {
    await initDatabase();
    startServer();
}

main();
