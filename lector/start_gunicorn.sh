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
exec python manage.py runserver 0.0.0.0:8000
