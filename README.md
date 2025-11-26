

<h1 align="center">Sistema de Registro y Gestión de Asistencia — Universidad del Bío-Bío</h1>

<p align="center"><em>Solución integral para la gestión automatizada y segura de la asistencia académica</em></p>

<hr/>

<h2>Infraestructura y Contenedores</h2>
<p>
El sistema se despliega utilizando <b>contenedores Docker</b> para facilitar la gestión, escalabilidad y portabilidad de los servicios. La infraestructura es provista por la Universidad del Bío-Bío e incluye:
</p>
<ul>
	<li><b>Backend</b>: Contenedor Docker dedicado para la API y lógica de negocio.</li>
	<li><b>Módulo Lector</b>: Contenedor Docker para el servicio de captura y registro de asistencia.</li>
	<li><b>Gestor Web</b>: Contenedor Docker para la plataforma de administración y visualización.</li>
	<li><b>MinIO</b>: Contenedor Docker para almacenamiento de imágenes y archivos, compatible con S3.</li>
</ul>
<p>
Esta arquitectura permite una integración eficiente entre los módulos y asegura la persistencia y seguridad de los datos.
</p>
<hr/>

<h2>Descripción General</h2>
<p>
Este proyecto es una solución integral para la gestión automatizada y segura de la asistencia académica en el Departamento de Sistemas de Información de la Universidad del Bío-Bío. El sistema reemplaza los registros manuales, optimizando la trazabilidad, reduciendo la carga administrativa y mejorando la seguridad de los datos.
</p>

<h3>Módulos Principales</h3>
<ul>
	<li><b>Lector</b>: Dispositivo Raspberry Pi con lector de códigos QR para registrar asistencia sin contacto.</li>
	<li><b>Gestor Web</b>: Plataforma web para administración, análisis y exportación de registros.</li>
	<li><b>Aplicación Móvil</b>: Versión adaptada para smartphones y tablets.</li>
</ul>
<hr/>

<h2>Características Destacadas</h2>
<ul>
	<li>Registro de asistencia mediante QR único por usuario.</li>
	<li>Almacenamiento local y sincronización automática con el servidor.</li>
	<li>Generación de reportes en PDF y Excel.</li>
	<li>Autenticación segura con JWT y cifrado de contraseñas.</li>
	<li>Interfaz adaptada para distintos perfiles: académicos, directores, asistentes y administradores.</li>
	<li>Arquitectura escalable y personalizable.</li>
</ul>
<hr/>

<h2>Tecnologías Utilizadas</h2>
<h3>Lector (Raspberry Pi)</h3>
<ul>
	<li><b>Lenguaje:</b> Python 3.11, Django 4.2 LTS</li>
	<li><b>Base de datos local:</b> SQLite</li>
	<li><b>Librerías:</b> OpenCV, Pyzbar, Requests, GPIO</li>
	<li><b>Hardware:</b> Raspberry Pi 4, Lector QR 3nStar SC410</li>
</ul>
<h3>Gestor Web</h3>
<ul>
	<li><b>Frontend:</b> React 18, Tailwind CSS, Bootstrap</li>
	<li><b>Backend:</b> Node.js 20, Express.js, Sequelize</li>
	<li><b>Base de datos:</b> PostgreSQL 15</li>
	<li><b>Seguridad:</b> JWT, Helmet, bcrypt.js</li>
</ul>
<hr/>

<h2>Estructura del Proyecto</h2>
<pre>
lector/      # Módulo de captura y registro
gestor/      # Plataforma web y API REST
docs/        # Documentación y diagramas
mobile/      # Aplicación móvil
README.md    # Este archivo
</pre>
<hr/>

<h2>Instalación y Ejecución</h2>
<h3>1. Clonar el repositorio</h3>
<pre>
git clone https://github.com/moisesAraya/RegistraUbb
cd registraubb
</pre>
<h3>2. Configurar el Lector</h3>
<pre>
cd lector
pip install -r requirements.txt
python manage.py runserver
</pre>
<h3>3. Configurar el Gestor Web</h3>
<pre>
cd gestor
npm install
npm start
</pre>
<h3>4. Variables de entorno (ejemplo)</h3>
<pre>
DB_HOST=localhost
DB_USER=postgres
DB_PASS=tu_password
JWT_SECRET=clave_segura
</pre>
<hr/>

<h2>Comparativa con Soluciones Comerciales</h2>
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
			<td><b>Propuesta UBB</b></td>
			<td><b>$615K CLP</b></td>
			<td><b>Baja</b></td>
			<td><b>Alta</b></td>
		</tr>
	</tbody>
</table>
<hr/>

<h2>Autores</h2>
<ul>
	<li><b>Moisés I. Araya Ramírez</b></li>
	<li><b>Andrea V. Tapia Zúñiga</b></li>
</ul>
<p><i>Universidad del Bío-Bío — Ingeniería Civil en Informática (2025)</i></p>
