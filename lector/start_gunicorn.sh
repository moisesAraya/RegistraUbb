#!/bin/bash
set -e

# Activar entorno virtual
source /root/RegistraUbb/lector/venv/bin/activate
cd /root/RegistraUbb/lector

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --noinput

echo "🚀 Iniciando servidor Django..."
<<<<<<< HEAD
exec python manage.py runserver 0.0.0.0:8000
=======
exec python manage.py runserver 0.0.0.0:80
>>>>>>> 89df166004e46036ba945dd5e78c18945085b4ef
