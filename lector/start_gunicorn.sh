#!/bin/bash
cd /root/RegistraUbb/lector
source venv/bin/activate

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

exec gunicorn mysite.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --env DJANGO_SETTINGS_MODULE=mysite.settings \
  --access-logfile - \
  --error-logfile -