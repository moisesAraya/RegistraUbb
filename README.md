<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
</head>
<body>

  <h1>RegistraUBB – Sistema de Registro y Gestión de Asistencia</h1>

  <p><em>
    Sistema de registro y gestión de asistencia para académicos del Departamento de Sistemas de Información
    de la Universidad del Bío-Bío, basado en Raspberry Pi, lectores de códigos QR y una plataforma web moderna.
  </em></p>

  <p>
    Este repositorio reúne el código fuente del proyecto de titulación desarrollado en Ingeniería Civil en Informática
    (UBB), cuyo objetivo general es registrar la asistencia de académicos mediante un módulo lector físico basado en
    Raspberry Pi con lectura de códigos QR, que interactúe en tiempo real con una plataforma web para almacenar, procesar
    y gestionar la información de asistencia de forma segura y eficiente.
  </p>

  <hr />

  <h2>📚 Tabla de contenidos</h2>
  <ul>
    <li><a href="#descripcion">Descripción del proyecto</a></li>
    <li><a href="#arquitectura">Arquitectura general</a></li>
    <li><a href="#caracteristicas">Características principales</a></li>
    <li><a href="#tecnologias">Tecnologías utilizadas</a></li>
    <li><a href="#estructura-repo">Estructura del repositorio</a></li>
    <li><a href="#requisitos-previos">Requisitos previos</a></li>
    <li><a href="#instalacion-ejecucion">Instalación y ejecución</a></li>
    <li><a href="#variables-entorno">Variables de entorno</a></li>
    <li><a href="#endpoints">Endpoints principales (API)</a></li>
    <li><a href="#roadmap">Roadmap y trabajo futuro</a></li>
    <li><a href="#creditos">Créditos</a></li>
    <li><a href="#licencia">Licencia</a></li>
  </ul>

  <hr />

  <h2 id="descripcion">📝 Descripción del proyecto</h2>

  <p>
    El Departamento de Sistemas de Información de la Universidad del Bío-Bío necesitaba modernizar
    el control de asistencia de sus académicos. El proceso previo se realizaba con planillas físicas,
    firmas manuales y consultas dispersas, lo que generaba:
  </p>
  <ul>
    <li>Alta carga administrativa para secretaría y jefaturas.</li>
    <li>Dificultad para auditar y trazar las horas efectivamente trabajadas.</li>
    <li>Riesgos en la integridad, confidencialidad y disponibilidad de la información.</li>
  </ul>

  <p>
    RegistraUBB propone una solución de bajo costo y basada en software libre que combina:
  </p>
  <ul>
    <li>Un <strong>módulo lector físico</strong> (Raspberry Pi + lector QR) para el marcaje de asistencia.</li>
    <li>Una <strong>plataforma web de gestión</strong> para administración, visualización de registros y generación de reportes.</li>
    <li>Una <strong>API REST</strong> central que conecta ambos mundos y garantiza seguridad, trazabilidad y consistencia de datos.</li>
  </ul>

  <p>
    El foco está puesto en:
    <strong>bajar la carga operativa</strong>, 
    <strong>aumentar la transparencia</strong> y
    <strong>mantener la autonomía tecnológica</strong>
    usando tecnologías abiertas y adaptadas al contexto universitario.
  </p>

  <hr />

  <h2 id="arquitectura">🏗️ Arquitectura general</h2>

  <p>
    La solución se organiza en tres grandes módulos desplegados típicamente con contenedores Docker:
  </p>

  <h3>1. Backend API (Node.js + Express + PostgreSQL)</h3>
  <ul>
    <li>Expuesto como servicio REST.</li>
    <li>Implementa la lógica de negocio, validaciones y reglas de asistencia.</li>
    <li>Persiste toda la información en una base de datos <strong>PostgreSQL</strong>.</li>
    <li>Autenticación basada en <strong>JWT</strong> y almacenamiento seguro de contraseñas con <strong>bcrypt</strong>.</li>
  </ul>

  <h3>2. Módulo Gestor (Frontend web – React)</h3>
  <ul>
    <li>Aplicación web desarrollada con <strong>React</strong> y <strong>Vite</strong>.</li>
    <li>Permite gestionar académicos, tótems, justificaciones y reportes.</li>
    <li>Incluye paneles de control, filtros por fecha, estado y tipo de registro.</li>
    <li>Consumo de la API mediante <strong>Axios</strong>.</li>
  </ul>

  <h3>3. Módulo Lector (Raspberry Pi + Django)</h3>
  <ul>
    <li>Ejecutado en una <strong>Raspberry Pi 4</strong> con Raspberry Pi OS Lite.</li>
    <li>Desarrollado en <strong>Python</strong> usando el framework <strong>Django</strong>.</li>
    <li>Captura los códigos QR mediante cámara/lector y los procesa con <strong>OpenCV</strong> y <strong>pyzbar</strong>.</li>
    <li>Envía las marcaciones al backend mediante solicitudes HTTP (principalmente <code>POST</code>).</li>
    <li>Incluye una pequeña interfaz web para mostrar la información del marcaje y validar PIN en el tótem.</li>
  </ul>

  <p>
    En producción, los servicios se despliegan en un servidor institucional (on-premise) con
    contenedores Docker independientes para backend, frontend de gestión y módulo lector, manteniendo
    el control de los datos dentro de la universidad.
  </p>

  <hr />

  <h2 id="caracteristicas">✨ Características principales</h2>

  <ul>
    <li>Registro de asistencia mediante <strong>códigos QR</strong> y <strong>tótem físico</strong>.</li>
    <li>Sincronización en tiempo real con el backend y la base de datos.</li>
    <li>Gestión de usuarios, roles y permisos (académico, administrador, desarrollador, etc.).</li>
    <li>Justificación de asistencias (con motivos, observaciones y estados de aprobación).</li>
    <li>Filtros avanzados por fechas, usuarios, estado de asistencia y tipo de jornada.</li>
    <li>Generación de reportes y métricas para apoyo a la toma de decisiones.</li>
    <li>Seguridad basada en <strong>JWT</strong>, <strong>bcrypt</strong>, cabeceras seguras (Helmet) y buenas prácticas de API.</li>
    <li>Uso de <strong>software libre</strong> y tecnologías abiertas para disminuir costos y dependencias de terceros.</li>
  </ul>

  <hr />

  <h2 id="tecnologias">🛠️ Tecnologías utilizadas</h2>

  <h3>Módulo Lector (Raspberry Pi + Django)</h3>
  <ul>
    <li><strong>Hardware:</strong> Raspberry Pi 4 + lector de códigos de barras / QR.</li>
    <li><strong>Sistema operativo:</strong> Raspberry Pi OS Lite (Bookworm).</li>
    <li><strong>Lenguaje:</strong> Python 3.</li>
    <li><strong>Framework backend:</strong> Django 4 (LTS).</li>
    <li><strong>Lectura de QR:</strong> OpenCV, Pyzbar.</li>
    <li><strong>Base de datos local:</strong> SQLite (para almacenamiento temporal).</li>
    <li><strong>Control de hardware:</strong> RPi.GPIO, gpiozero.</li>
  </ul>

  <h3>Módulo Gestor (Frontend Web)</h3>
  <ul>
    <li><strong>Lenguaje:</strong> JavaScript / JSX (ES2021).</li>
    <li><strong>Biblioteca:</strong> React 18 (Vite).</li>
    <li><strong>Estilos:</strong> Tailwind CSS y/o Bootstrap.</li>
    <li><strong>HTTP client:</strong> Axios.</li>
  </ul>

  <h3>Backend API</h3>
  <ul>
    <li><strong>Lenguaje:</strong> Node.js 20 (LTS).</li>
    <li><strong>Framework:</strong> Express.js.</li>
    <li><strong>Base de datos:</strong> PostgreSQL 15.</li>
    <li><strong>ORM:</strong> Sequelize.</li>
    <li><strong>Autenticación:</strong> JWT.</li>
    <li><strong>Seguridad adicional:</strong> Helmet, middlewares de validación.</li>
  </ul>

  <h3>Herramientas de apoyo</h3>
  <ul>
    <li>Git + GitHub para control de versiones.</li>
    <li>Postman para pruebas de API.</li>
    <li>Visual Studio Code como editor principal.</li>
    <li>Docker para despliegue en servidor institucional.</li>
  </ul>

  <hr />

  <h2 id="estructura-repo">📁 Estructura del repositorio</h2>

  <p><em>Nota:</em> Los nombres de carpetas pueden variar según la organización final del proyecto. Ajusta esta sección si tu repo usa otros nombres.</p>

  <pre><code>.
├── backend/               # API REST (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/        # Modelos Sequelize
│   │   ├── routes/
│   │   └── services/
│   ├── migrations/
│   ├── seeders/
│   ├── package.json
│   └── ...
│
├── frontend-gestor/       # Frontend de gestión (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── Context/
│   │   └── ...
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── ...
│
├── lector-django/         # Módulo lector (Django + Python)
│   ├── mysite/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── modlector/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── templates/
│   │   └── ...
│   ├── static/
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
│
└── docs/                  # Documentación, diagramas, etc.
    └── ...
</code></pre>

  <hr />

  <h2 id="requisitos-previos">✅ Requisitos previos</h2>

  <ul>
    <li><strong>Node.js</strong> (v18+ recomendado, el proyecto se probó con Node 20 LTS).</li>
    <li><strong>npm</strong> o <strong>yarn</strong>.</li>
    <li><strong>Python 3</strong> (3.11+ recomendado) y <strong>pip</strong>.</li>
    <li><strong>PostgreSQL</strong> 15 o compatible.</li>
    <li><strong>Git</strong>.</li>
    <li>Opcional: <strong>Docker</strong> y <strong>docker-compose</strong> para despliegue contenedorizado.</li>
    <li>Para el módulo lector: Raspberry Pi 4 con Raspberry Pi OS Lite y un lector/cámara QR.</li>
  </ul>

  <hr />

  <h2 id="instalacion-ejecucion">🚀 Instalación y ejecución</h2>

  <h3>1. Clonar el repositorio</h3>
  <pre><code>git clone &lt;https://github.com/moisesAraya/RegistraUbb&gt;;
</code></pre>

  <h3>2. Backend (Node.js + Express)</h3>

  <ol>
    <li>Entrar a la carpeta del backend:</li>
  </ol>

  <pre><code>cd backend
</code></pre>

  <ol start="2">
    <li>Instalar dependencias:</li>
  </ol>

  <pre><code>npm install
# o
yarn install
</code></pre>

  <ol start="3">
    <li>Configurar variables de entorno (ver sección <a href="#variables-entorno">Variables de entorno</a>).</li>
    <li>Ejecutar migraciones y seeders si aplican:</li>
  </ol>

  <pre><code>npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
</code></pre>

  <ol start="5">
    <li>Levantar el servidor de desarrollo:</li>
  </ol>

  <pre><code>npm run dev
# o
npm start
</code></pre>

  <p>Por defecto la API suele estar expuesta en un puerto tipo <code>http://localhost:1772</code> (ajusta según tu configuración).</p>

  <h3>3. Frontend Gestor (React + Vite)</h3>

  <ol>
    <li>Entrar a la carpeta del frontend:</li>
  </ol>

  <pre><code>cd frontend-gestor
</code></pre>

  <ol start="2">
    <li>Instalar dependencias:</li>
  </ol>

  <pre><code>npm install
# o
yarn install
</code></pre>

  <ol start="3">
    <li>Configurar la URL del backend en el archivo de entorno (por ejemplo <code>.env</code> o <code>.env.local</code>):</li>
  </ol>

  <pre><code>VITE_API_BASE_URL=http://localhost:1772/api
</code></pre>

  <ol start="4">
    <li>Levantar el servidor de desarrollo:</li>
  </ol>

  <pre><code>npm run dev
</code></pre>

  <p>Vite normalmente expone la app en <code>http://localhost:5173</code> o similar.</p>

  <h3>4. Módulo Lector (Django en Raspberry Pi)</h3>

  <ol>
    <li>Copiar o clonar este repo en la Raspberry Pi.</li>
    <li>Entrar a la carpeta del proyecto Django:</li>
  </ol>

  <pre><code>cd lector-django
</code></pre>

  <ol start="3">
    <li>Crear y activar un entorno virtual:</li>
  </ol>

  <pre><code>python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
</code></pre>

  <ol start="4">
    <li>Instalar dependencias:</li>
  </ol>

  <pre><code>pip install -r requirements.txt
</code></pre>

  <ol start="5">
    <li>Aplicar migraciones y crear superusuario si es necesario:</li>
  </ol>

  <pre><code>python manage.py migrate
python manage.py createsuperuser
</code></pre>

  <ol start="6">
    <li>Configurar las variables de entorno/ajustes de producción (URL del backend, tokens, etc.).</li>
    <li>Levantar el servidor de desarrollo o el servidor WSGI/ASGI que utilices:</li>
  </ol>

  <pre><code>python manage.py runserver 0.0.0.0:8000
</code></pre>

  <p>
    El módulo lector se encargará de capturar el QR, decodificarlo y enviar el marcaje al backend
    mediante solicitudes HTTP.
  </p>

  <hr />

  <h2 id="variables-entorno">🔐 Variables de entorno</h2>

  <p>Ejemplos típicos de configuración (ajusta nombres según tu implementación):</p>

  <h3>Backend</h3>
  <pre><code># .env
PORT=1772
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=registraubb
DB_USER=postgres
DB_PASSWORD=&lt;tu_password&gt;

JWT_SECRET=&lt;una_clave_segura&gt;
JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://localhost:5173
</code></pre>

  <h3>Frontend Gestor</h3>
  <pre><code># .env
VITE_API_BASE_URL=http://localhost:1772/api
</code></pre>

  <h3>Módulo Lector (Django)</h3>
  <pre><code># variables de ejemplo
BACKEND_API_BASE_URL=http://&lt;IP_BACKEND&gt;:1772/api
LECTOR_SECRET_TOKEN=&lt;token_compartido_si_aplica&gt;
DEBUG=False  # en producción
</code></pre>

  <hr />

  <h2 id="endpoints">🌐 Endpoints principales (API)</h2>

  <p>Algunos módulos de la API (los nombres reales pueden variar):</p>

  <h3>Módulo de asistencia</h3>
  <ul>
    <li><code>GET /api/asistencia</code> – Lista de asistencias según permisos del usuario autenticado.</li>
    <li><code>POST /api/asistencia/marcar</code> – Registra un marcaje de asistencia desde el QR/tótem.</li>
    <li><code>POST /api/asistencia/manual</code> – Registra asistencias manuales por personal autorizado.</li>
    <li><code>GET /api/asistencia/justificaciones</code> – Obtiene las justificaciones registradas.</li>
    <li><code>POST /api/asistencia/justificacion</code> – Crea una nueva justificación.</li>
  </ul>

  <h3>Módulo de autenticación</h3>
  <ul>
    <li><code>POST /api/auth/login</code> – Autentica al usuario y genera un token JWT.</li>
    <li><code>POST /api/auth/logout</code> – Cierra sesión e invalida el token.</li>
    <li><code>GET /api/auth/token-info</code> – Devuelve información del token actual.</li>
    <li><code>POST /api/auth/recover-password</code> – Inicia flujo de recuperación de contraseña.</li>
  </ul>

  <h3>Módulo de dashboard / reportes</h3>
  <ul>
    <li><code>GET /api/dashboard</code> – Métricas generales y estadísticas de asistencia.</li>
    <li><code>GET /api/reportes/...</code> – Endpoints específicos para reportes filtrados por rango de fechas, usuario, estado, etc.</li>
  </ul>

  <p>
    En el documento de tesis se detallan más endpoints, su estructura de request/response y reglas
    de negocio asociadas.
  </p>

  <hr />

  <h2 id="roadmap">🧭 Roadmap y trabajo futuro</h2>

  <p>Algunas líneas de trabajo que se dejaron abiertas o son naturales como evolución del sistema:</p>
  <ul>
    <li>Incorporar tecnologías adicionales como NFC o biometría (huella/rostro) como segundo factor.</li>
    <li>Extender el sistema a otros departamentos y facultades.</li>
    <li>Agregar más tipos de reportes (cumplimiento horario, alertas de atrasos recurrentes, etc.).</li>
    <li>Refinar la aplicación móvil / vista responsiva para académicos.</li>
    <li>Integración con otros sistemas institucionales (por ejemplo, sistemas de RR.HH. o académicos).</li>
  </ul>

  <hr />

  <h2 id="creditos">👥 Créditos</h2>

  <p>
    Proyecto desarrollado como trabajo de titulación de la carrera de
    <strong>Ingeniería Civil en Informática</strong> de la
    <strong>Universidad del Bío-Bío</strong>, en el
    <strong>Departamento de Sistemas de Información</strong>.
  </p>

  <p>
    Este repositorio resume muchas horas de diseño, desarrollo, documentación, despliegue
    y pruebas. Si llegaste hasta aquí y el código te sirve para aprender, investigar o
    implementar algo similar en tu institución: bienvenido/a, la idea es justamente que
    esto sea útil y que siga creciendo ❤️.
  </p>

  <hr />


</body>
</html>
