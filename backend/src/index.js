import app from './app.js';
import { sequelize } from './config/dbconfig.js';

import './entities/usuario.entity.js'; 
import './entities/justificacion.entity.js';
import './entities/rol.entity.js';
import './entities/marcaje.entity.js';
import './entities/notificacion.entity.js';
import './entities/motivo.entity.js';
import './entities/qr.entity.js';
import './entities/totem.entity.js';

async function main(){
    try {


await sequelize.authenticate();
console.log('Conexión a la base de datos establecida correctamente.');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
}

main();

 

