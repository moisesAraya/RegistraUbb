#!/bin/bash
cd /root/RegistraUbb/lector
<<<<<<< HEAD
source venv/bin/activate
exec gunicorn mysite.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --env DJANGO_SETTINGS_MODULE=mysite.settings \
  --access-logfile - \
  --error-logfile -
=======

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --noinput

echo "🚀 Iniciando servidor Django..."
exec python manage.py runserver 0.0.0.0:8000
>>>>>>> a483ff9a50efbd784ab6eabf95488bc5be16bb85
