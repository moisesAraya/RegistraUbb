import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

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

// Importar relaciones después de cargar las entidades
import './relations.js';
console.log('Relaciones cargadas');