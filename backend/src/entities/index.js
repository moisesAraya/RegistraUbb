import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sequelize } from '../config/dbconfig.js';
import Usuario from './usuario.entity.js';
import Rol from './rol.entity.js';
import Cargo from './cargo.entity.js';
import Marcaje from './marcaje.entity.js';
import RegistroMarcaje from './registro_marcaje.entity.js';
import Totem from './totem.entity.js';
import QR from './qr.entity.js';
import Justificacion from './justificacion.entity.js';
import Motivo from './motivo.entity.js';
import Notificacion from './notificacion.entity.js';
import Asistencia from './asistencia.entity.js';

// Importar relaciones
import './relations.js';

// ✅ EXPORTAR SEQUELIZE Y TODOS LOS MODELOS
export { sequelize };

export {
  Usuario,
  Rol,
  Cargo,
  Marcaje,
  RegistroMarcaje,
  Totem,
  QR,
  Justificacion,
  Motivo,
  Notificacion,
  Asistencia,
  RegistroJust
};

// Exportar default para compatibilidad
export default {
  sequelize,
  Usuario,
  Rol,
  Cargo,
  Marcaje,
  RegistroMarcaje,
  Totem,
  QR,
  Justificacion,
  Motivo,
  Notificacion,
  Asistencia,
  RegistroJust
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entitiesDir = __dirname;

fs.readdirSync(entitiesDir)
  .filter((file) => file.endsWith(".entity.js"))
  .forEach(async (file) => {
    const fileUrl = pathToFileURL(path.join(entitiesDir, file)).href;
    await import(fileUrl);
    console.log(`Entidad cargada: ${file}`);
  });

console.log('✅ [ENTITIES] Todos los modelos y sequelize exportados correctamente');