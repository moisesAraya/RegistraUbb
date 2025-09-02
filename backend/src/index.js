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
        await sequelize.sync()
        console.log('Database connection has been established successfully.');
        app.listen(3000);
        console.log('Server is running on port 3000');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
    
}

main();
 

