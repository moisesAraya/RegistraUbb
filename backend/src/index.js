import app from './app.js';
import { sequelize } from './config/dbconfig.js';

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
import CargoUsuario from './entities/cargo_usuario.entity.js';
import RegistroMarcaje from './entities/registro_marcaje.entity.js';
import RegistroJust from './entities/registro_just.entity.js';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');

        // Sincroniza las tablas en orden  respetar claves foráneas
        await Rol.sync();
        await Cargo.sync();
        await Usuario.sync();
        await QR.sync();
        await Totem.sync();
        await Motivo.sync();
        await Marcaje.sync();
        await Asistencia.sync();
        await Justificacion.sync();
        await CargoUsuario.sync();
        await RegistroMarcaje.sync();
        await RegistroJust.sync();
        await Notificacion.sync();

        console.log('Todas las tablas fueron sincronizadas correctamente.');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
}

main();