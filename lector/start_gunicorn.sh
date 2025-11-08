#!/bin/bash
# filepath: c:\Users\andre\Documents\Universidad\PROYECTO DE TITULO\RegistraUBB\RegistraUbb\lector\start_gunicorn.sh
cd /root/RegistraUbb/lector
source venv/bin/activate

# Crear directorio de logs si no existe
mkdir -p /var/log/django

# Recolectar archivos estáticos
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

# Ejecutar migraciones
echo "🗃️ Ejecutando migraciones..."
python manage.py migrate

echo "🚀 Iniciando Gunicorn..."
exec gunicorn mysite.wsgi:application \
  --bind 127.0.0.1:8000 \
  --workers 3 \
  --worker-class sync \
  --timeout 300 \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --preload \
  --env DJANGO_SETTINGS_MODULE=mysite.settings \
  --access-logfile /var/log/django/gunicorn_access.log \
  --error-logfile /var/log/django/gunicorn_error.log \
  --log-level info