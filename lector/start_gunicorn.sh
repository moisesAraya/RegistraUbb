#!/bin/bash
cd /root/RegistraUbb/lector
source venv/bin/activate
exec gunicorn mysite.wsgi:application \
  --bind 0.0.0.0:8080 \
  --workers 3 \
  --env DJANGO_SETTINGS_MODULE=mysite.settings \
  --access-logfile - \
  --error-logfile -
