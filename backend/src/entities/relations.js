"use strict";

// ✅ IMPORTAR TODAS LAS ENTIDADES NECESARIAS
import Usuario from "./usuario.entity.js";
import Marcaje from "./marcaje.entity.js";
import RegistroMarcaje from "./registro_marcaje.entity.js";
import Asistencia from "./asistencia.entity.js";
import Justificacion from "./justificacion.entity.js";
import Rol from "./rol.entity.js";
import Totem from "./totem.entity.js";
import Cargo from "./cargo.entity.js";
import Motivo from "./motivo.entity.js";
import Notificacion from "./notificacion.entity.js";
import QR from "./qr.entity.js";

function setupRelations() {
    try {
        console.log('🔗 [RELATIONS] Configurando relaciones entre entidades...');

        // 1️⃣ MARCAJE <-> REGISTRO_MARCAJE (1:N)
        Marcaje.hasMany(RegistroMarcaje, { 
            foreignKey: 'id_marcaje', 
            as: 'registroMarcajes'
        });

        RegistroMarcaje.belongsTo(Marcaje, { 
            foreignKey: 'id_marcaje', 
            as: 'marcaje'
        });

        // 2️⃣ USUARIO <-> REGISTRO_MARCAJE (1:N)
        Usuario.hasMany(RegistroMarcaje, { 
            foreignKey: 'rut_usuario', 
            as: 'registroMarcajes' 
        });

        RegistroMarcaje.belongsTo(Usuario, { 
            foreignKey: 'rut_usuario', 
            as: 'usuario'
        });

        // 3️⃣ ASISTENCIA <-> MARCAJE (N:1)
        Asistencia.belongsTo(Marcaje, { 
            foreignKey: 'id_marcaje', 
            as: 'marcajeAsistencia'
        });

        Marcaje.hasMany(Asistencia, { 
            foreignKey: 'id_marcaje', 
            as: 'asistencias' 
        });

        // 4️⃣ ASISTENCIA <-> JUSTIFICACION (N:1)
        Asistencia.belongsTo(Justificacion, { 
            foreignKey: 'id_justificacion', 
            as: 'justificacion' 
        });

        Justificacion.hasMany(Asistencia, { 
            foreignKey: 'id_justificacion', 
            as: 'asistencias' 
        });

        // 5️⃣ USUARIO <-> JUSTIFICACION (1:N) ⭐ NUEVA RELACIÓN
        Usuario.hasMany(Justificacion, { 
            foreignKey: 'rut_usuario', 
            as: 'justificaciones' 
        });

        Justificacion.belongsTo(Usuario, { 
            foreignKey: 'rut_usuario', 
            as: 'usuario' 
        });

        // 6️⃣ USUARIO <-> ROL (N:1)
        Usuario.belongsTo(Rol, { 
            foreignKey: 'id_rol', 
            as: 'rol' 
        });

        Rol.hasMany(Usuario, { 
            foreignKey: 'id_rol', 
            as: 'usuarios' 
        });

        // 7️⃣ REGISTRO_MARCAJE <-> TOTEM (N:1)
        RegistroMarcaje.belongsTo(Totem, { 
            foreignKey: 'id_totem', 
            as: 'totem' 
        });

        Totem.hasMany(RegistroMarcaje, { 
            foreignKey: 'id_totem', 
            as: 'registros' 
        });

        // 8️⃣ MARCAJE <-> TOTEM (N:1)
        Marcaje.belongsTo(Totem, { 
            foreignKey: 'id_totem', 
            as: 'totem' 
        });

        Totem.hasMany(Marcaje, { 
            foreignKey: 'id_totem', 
            as: 'marcajes' 
        });

        // USUARIO <-> CARGO (si aplica)
        if (Usuario.rawAttributes.id_cargo) {
            Usuario.belongsTo(Cargo, { 
                foreignKey: 'id_cargo', 
                as: 'cargo' 
            });

            Cargo.hasMany(Usuario, { 
                foreignKey: 'id_cargo', 
                as: 'usuarios' 
            });
        }

        // JUSTIFICACION <-> MOTIVO (si aplica)
        if (Justificacion.rawAttributes.id_motivo) {
            Justificacion.belongsTo(Motivo, { 
                foreignKey: 'id_motivo', 
                as: 'motivo' 
            });

            Motivo.hasMany(Justificacion, { 
                foreignKey: 'id_motivo', 
                as: 'justificaciones' 
            });
        }

        // USUARIO <-> NOTIFICACION (si aplica)
        if (Notificacion.rawAttributes.rut_usuario) {
            Usuario.hasMany(Notificacion, { 
                foreignKey: 'rut_usuario', 
                as: 'notificaciones' 
            });

            Notificacion.belongsTo(Usuario, { 
                foreignKey: 'rut_usuario', 
                as: 'usuario' 
            });
        }

        // TOTEM <-> QR (si aplica)
        if (QR.rawAttributes.id_totem) {
            Totem.hasMany(QR, { 
                foreignKey: 'id_totem', 
                as: 'qrs' 
            });

            QR.belongsTo(Totem, { 
                foreignKey: 'id_totem', 
                as: 'totem' 
            });
        }

        console.log('✅ [RELATIONS] Todas las relaciones configuradas correctamente');

    } catch (error) {
        console.error('❌ [RELATIONS] Error configurando relaciones:', error);
        throw error;
    }
}

export { setupRelations };

console.log('🔗 [RELATIONS] Módulo de relaciones cargado');