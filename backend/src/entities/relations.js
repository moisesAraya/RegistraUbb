import Usuario from './usuario.entity.js';
import Rol from './rol.entity.js';
import Cargo from './cargo.entity.js';
import Justificacion from './justificacion.entity.js';
import RegistroJust from './registro_just.entity.js';
import Marcaje from './marcaje.entity.js';
import RegistroMarcaje from './registro_marcaje.entity.js';

export function setupRelations() {
  console.log('🔧 Configurando relaciones...');
  
  // Relaciones Usuario - Rol
  Usuario.belongsTo(Rol, {
    foreignKey: 'id_rol',
    as: 'rol'
  });
  
  Rol.hasMany(Usuario, {
    foreignKey: 'id_rol',
    as: 'usuarios'
  });

  // Relaciones Usuario - Cargo
  Usuario.belongsTo(Cargo, {
    foreignKey: 'id_cargo',
    as: 'cargo'
  });
  
  Cargo.hasMany(Usuario, {
    foreignKey: 'id_cargo',
    as: 'usuarios'
  });

  // Relaciones Usuario - RegistroJust
  Usuario.hasMany(RegistroJust, { 
    foreignKey: 'rut_usuario',
    as: 'registrosJustificacion'
  });
  
  RegistroJust.belongsTo(Usuario, { 
    foreignKey: 'rut_usuario',
    as: 'usuario'
  });

  // Relaciones Justificacion - RegistroJust
  Justificacion.hasMany(RegistroJust, { 
    foreignKey: 'id_justificacion',
    as: 'registros'
  });
  
  RegistroJust.belongsTo(Justificacion, { 
    foreignKey: 'id_justificacion',
    as: 'justificacion'
  });

  // Relaciones Usuario - RegistroMarcaje
  Usuario.hasMany(RegistroMarcaje, { 
    foreignKey: 'rut_usuario',
    as: 'registrosMarcaje'
  });
  
  RegistroMarcaje.belongsTo(Usuario, { 
    foreignKey: 'rut_usuario',
    as: 'usuarioMarcaje'
  });

  // Relaciones Marcaje - RegistroMarcaje
  Marcaje.hasMany(RegistroMarcaje, { 
    foreignKey: 'id_marcaje',
    as: 'registros'
  });
  
  RegistroMarcaje.belongsTo(Marcaje, { 
    foreignKey: 'id_marcaje',
    as: 'marcaje'
  });

  console.log('✅ Todas las relaciones configuradas correctamente');
}

export {
  Usuario,
  Rol,
  Cargo,
  Justificacion,
  RegistroJust,
  Marcaje,
  RegistroMarcaje
};