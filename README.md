<h1 align="center">📌 Sistema de Registro y Gestión de Asistencia – Universidad del Bío-Bío</h1>

<p align="center">
  <em>Solución tecnológica de bajo costo para la gestión eficiente, segura y automatizada de la asistencia académica</em>
</p>

<hr/>

<h2>📖 Descripción del Proyecto</h2>
<p>
Este proyecto implementa un <strong>sistema automatizado, seguro y de bajo costo</strong> para el registro y gestión de asistencia de académicos del 
<strong>Departamento de Sistemas de Información</strong> de la <strong>Universidad del Bío-Bío</strong>.
<br/><br/>
La solución reemplaza los registros manuales, eliminando problemas de trazabilidad, sobrecarga administrativa y vulnerabilidad en la gestión de datos.
</p>

<ul>
  <li>📷 <b>Módulo de Captura (Lector)</b>: Raspberry Pi + lector de códigos QR para registrar asistencia sin contacto.</li>
  <li>💻 <b>Plataforma Web (Gestor)</b>: Gestión, filtrado, análisis y exportación de registros.</li>
  <li>📱 <b>Aplicación Móvil</b>: Versión adaptada para smartphones y tablets.</li>
</ul>

<hr/>

<h2>🚀 Características Principales</h2>
<ul>
  <li>Registro con <b>QR único</b> por usuario.</li>
  <li>Almacenamiento local y sincronización automática.</li>
  <li>Reportes en <b>PDF</b> y <b>Excel</b>.</li>
  <li>Autenticación segura con <code>JWT</code> y cifrado con <code>bcrypt</code>.</li>
  <li>Interfaz adaptada para <i>académicos, directores, asistentes y administradores</i>.</li>
  <li>100% <b>personalizable</b> y <b>escalable</b>.</li>
</ul>

<hr/>

<h2>🛠️ Tecnologías Utilizadas</h2>

<h3>📷 Módulo Lector (Raspberry Pi)</h3>
<ul>
  <li><b>Lenguaje:</b> Python 3.11 + Django 4.2 LTS</li>
  <li><b>Base de datos local:</b> SQLite</li>
  <li><b>Librerías:</b> OpenCV, Pyzbar, Requests, GPIO</li>
  <li><b>Hardware:</b> Raspberry Pi 4 + Lector QR 3nStar SC410</li>
</ul>

<h3>💻 Módulo Gestor (Plataforma Web)</h3>
<ul>
  <li><b>Frontend:</b> React 18, Tailwind CSS, Bootstrap</li>
  <li><b>Backend:</b> Node.js 20, Express.js, Sequelize</li>
  <li><b>Base de datos:</b> PostgreSQL 15</li>
  <li><b>Seguridad:</b> JWT, Helmet, bcrypt.js</li>
</ul>

<hr/>

<h2>📂 Estructura del Proyecto</h2>
<pre>
├── lector/         # Código del módulo de captura
├── gestor/         # Plataforma web y API REST
├── docs/           # Documentación y diagramas
├── mobile/         # Aplicación móvil
└── README.md       # Este archivo
</pre>

<hr/>

<h2>⚙️ Instalación y Ejecución</h2>

<h3>1️⃣ Clonar repositorio</h3>
<pre>
git clone https://github.com/moisesAraya/RegistraUbb
cd registra
</pre>

<h3>2️⃣ Configurar Módulo Lector</h3>
<pre>
cd lector
pip install -r requirements.txt
python manage.py runserver
</pre>

<h3>3️⃣ Configurar Módulo Gestor</h3>
<pre>
cd gestor
npm install
npm start
</pre>

<h3>4️⃣ Variables de entorno</h3>
<pre>
DB_HOST=localhost
DB_USER=postgres
DB_PASS=tu_password
JWT_SECRET=clave_segura
</pre>

<hr/>

<h2>📊 Comparativa con Soluciones Comerciales</h2>
<table>
<thead>
<tr>
  <th>Solución</th>
  <th>Costo aprox.</th>
  <th>Dependencia tecnológica</th>
  <th>Adaptabilidad</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Suprema F2</td>
  <td>$2.44M CLP</td>
  <td>Alta</td>
  <td>Baja</td>
</tr>
<tr>
  <td>ZKTeco ProFace X</td>
  <td>$1.33M CLP</td>
  <td>Moderada</td>
  <td>Media</td>
</tr>
<tr>
  <td>MorphoWave SP</td>
  <td>$3.40M CLP</td>
  <td>Alta</td>
  <td>Baja</td>
</tr>
<tr>
  <td><b>Propuesta</b></td>
  <td><b>$615K CLP</b></td>
  <td><b>Baja</b></td>
  <td><b>Alta</b></td>
</tr>
</tbody>
</table>

<hr/>

<h2>✍️ Autores</h2>
<ul>
  <li><b>Moisés I. Araya Ramírez</b></li>
  <li><b>Andrea V. Tapia Zúñiga</b></li>
</ul>
<p><i>Universidad del Bío-Bío – Ingeniería Civil en Informática (2025)</i></p>
