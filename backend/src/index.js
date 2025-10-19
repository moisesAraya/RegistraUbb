import app from './app.js';
import { sequelize } from './config/dbconfig.js';
import { setupRelations } from './entities/relations.js'; 

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
import RegistroJust from './entities/registro_just.entity.js';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');

        console.log('🔧 Configurando relaciones...');
        setupRelations();
        console.log('✅ Todas las relaciones configuradas correctamente');

        console.log('📋 Sincronizando tablas en orden...');

        // PASO 1: Tablas base (ya creadas)
        await Rol.sync();
        console.log('✅ Tabla Rol sincronizada');
        
        await Cargo.sync();
        console.log('✅ Tabla Cargo sincronizada');
        
        await Usuario.sync();
        console.log('✅ Tabla Usuario sincronizada');
        
        await QR.sync();
        console.log('✅ Tabla QR sincronizada');
        
        await Totem.sync();
        console.log('✅ Tabla Totem sincronizada');

        // PASO 2: Tablas independientes (sin foreign keys complejas)
        await Justificacion.sync();
        console.log('✅ Tabla Justificacion sincronizada');
        
        await Marcaje.sync();
        console.log('✅ Tabla Marcaje sincronizada');
        
        await Asistencia.sync();
        console.log('✅ Tabla Asistencia sincronizada');

        // PASO 3: Tablas que dependen de Justificacion
        await Motivo.sync();
        console.log('✅ Tabla Motivo sincronizada');

        // PASO 4: Tablas de registro (dependen de otras)
        await RegistroMarcaje.sync();
        console.log('✅ Tabla RegistroMarcaje sincronizada');
        
        await RegistroJust.sync();
        console.log('✅ Tabla RegistroJust sincronizada');

        // PASO 5: Notificaciones al final
        await Notificacion.sync();
        console.log('✅ Tabla Notificacion sincronizada');

        console.log('🎉 Todas las tablas fueron sincronizadas correctamente.');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
        console.error('Detalles del error:', error.message);
    }
}

main();