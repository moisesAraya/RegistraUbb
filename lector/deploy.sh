#!/bin/bash
# deploy.sh - Script de despliegue simple para servidor SSH

echo "🚀 Desplegando Django en servidor..."

# Configurar variables de entorno
export DJANGO_SETTINGS_MODULE=mysite.production_settings

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar migraciones
echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --settings=mysite.production_settings

# Recolectar archivos estáticos
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --settings=mysite.production_settings

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar el servidor ejecuta:"
echo "gunicorn mysite.wsgi:application --bind 0.0.0.0:8000 --workers 3 --env DJANGO_SETTINGS_MODULE=mysite.production_settings"
echo ""
echo "🔗 Tu aplicación estará en: http://146.83.194.142:8000"