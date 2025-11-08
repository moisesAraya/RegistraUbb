#!/bin/bash
set -e

# Activar entorno virtual
source /root/RegistraUbb/lector/venv/bin/activate
cd /root/RegistraUbb/lector

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --noinput

echo "🚀 Iniciando Gunicorn..."
# El "exec" reemplaza el proceso actual y mantiene Gunicorn en primer plano
exec gunicorn mysite.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --access-logfile /root/RegistraUbb/lector/gunicorn_access.log \
  --error-logfile /root/RegistraUbb/lector/gunicorn_error.log
