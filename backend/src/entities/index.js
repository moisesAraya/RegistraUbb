import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sequelize } from '../config/dbconfig.js';
import Usuario from './usuario.entity.js';
import Rol from './rol.entity.js';
import Cargo from './cargo.entity.js';
import Marcaje from './marcaje.entity.js';
import Totem from './totem.entity.js';
import QR from './qr.entity.js';
import Justificacion from './justificacion.entity.js';
import Motivo from './motivo.entity.js';
import Notificacion from './notificacion.entity.js';

// Importar relaciones
import './relations.js';

// ✅ EXPORTAR SEQUELIZE Y TODOS LOS MODELOS
export { sequelize };

export {
  Usuario,
  Rol,
  Cargo,
  Marcaje,
  Totem,
  QR,
  Justificacion,
  Motivo,
  Notificacion
};


console.log('✅ [ENTITIES] Todos los modelos y sequelize exportados correctamente');