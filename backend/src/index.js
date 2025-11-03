import app from './app.js';
import { sequelize } from './config/dbconfig.js';
import { setupRelations } from './entities/relations.js';
import https from 'https';
import fs from 'fs';

// Entidades (modelos Sequelize)
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

// ============================================================
// 🧩 Función: Inicializar Base de Datos
// ============================================================

async function initDatabase() {
  try {
    console.log('🚀 Iniciando conexión con la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    console.log('🔧 Configurando relaciones...');
    setupRelations();
    console.log('✅ Relaciones configuradas correctamente.');

    console.log('📋 Sincronizando tablas en orden lógico...');

    // PASO 1: Tablas base con manejo de errores individual
    try {
      await Rol.sync();
      console.log('✅ Tabla Rol sincronizada');
    } catch (error) {
      console.error('❌ Error en Rol:', error.message);
    }

    try {
      await Cargo.sync();
      console.log('✅ Tabla Cargo sincronizada');
    } catch (error) {
      console.error('❌ Error en Cargo:', error.message);
    }

    try {
      await Usuario.sync();
      console.log('✅ Tabla Usuario sincronizada');
    } catch (error) {
      console.error('❌ Error en Usuario:', error.message);
      console.error('❌ Detalles completos:', error);
    }

    try {
      await QR.sync();
      console.log('✅ Tabla QR sincronizada');
    } catch (error) {
      console.error('❌ Error en QR:', error.message);
    }

    try {
      await Totem.sync();
      console.log('✅ Tabla Totem sincronizada');
    } catch (error) {
      console.error('❌ Error en Totem:', error.message);
    }

    // PASO 2: Tablas sin dependencias fuertes
    try {
      await Justificacion.sync();
      console.log('✅ Tabla Justificacion sincronizada');
    } catch (error) {
      console.error('❌ Error en Justificacion:', error.message);
    }

    try {
      await Marcaje.sync();
      console.log('✅ Tabla Marcaje sincronizada');
    } catch (error) {
      console.error('❌ Error en Marcaje:', error.message);
    }

    try {
      await Asistencia.sync();
      console.log('✅ Tabla Asistencia sincronizada');
    } catch (error) {
      console.error('❌ Error en Asistencia:', error.message);
    }

    // PASO 3: Tablas dependientes
    try {
      await Motivo.sync();
      console.log('✅ Tabla Motivo sincronizada');
    } catch (error) {
      console.error('❌ Error en Motivo:', error.message);
    }

    try {
      await RegistroMarcaje.sync();
      console.log('✅ Tabla RegistroMarcaje sincronizada');
    } catch (error) {
      console.error('❌ Error en RegistroMarcaje:', error.message);
    }

    try {
      await Notificacion.sync();
      console.log('✅ Tabla Notificacion sincronizada');
    } catch (error) {
      console.error('❌ Error en Notificacion:', error.message);
    }

    console.log('🎉 Proceso de sincronización completado.');
  } catch (error) {
    console.error('❌ Error al conectar o sincronizar la base de datos:');
    console.error('📋 Mensaje:', error.message);
    console.error('📋 Stack completo:', error.stack);
  }
}

// ============================================================
// 🌐 Función: Iniciar Servidor (HTTP/HTTPS según entorno)
// ============================================================
function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || (isProd ? 443 : 3000);
  const HOST = process.env.HOST || '0.0.0.0';

  if (isProd) {
    try {
      const options = {
        key: fs.readFileSync('/etc/ssl/registraubb/server.key'),
        cert: fs.readFileSync('/etc/ssl/registraubb/server.crt'),
      };

      https.createServer(options, app).listen(PORT, HOST, () => {
        console.log('🔐 Certificados SSL cargados correctamente.');
        console.log(`🚀 Servidor HTTPS corriendo en https://146.83.194.142:${PORT}`);
      });
    } catch (error) {
      console.error('❌ Error al cargar certificados SSL:', error.message);
      console.log('➡️ Iniciando servidor HTTP de respaldo...');
      app.listen(PORT, HOST, () => {
        console.log(`🚧 Servidor HTTP corriendo en http://${HOST}:${PORT}`);
      });
    }
  } else {
    app.listen(PORT, HOST, () => {
      console.log(`🧪 Servidor de desarrollo corriendo en http://localhost:${PORT}`);
    });
  }
}

// ============================================================
// 🏁 Ejecución principal
// ============================================================
async function main() {
  await initDatabase();
  startServer();
}

main();
