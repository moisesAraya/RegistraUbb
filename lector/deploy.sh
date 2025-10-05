#!/bin/bash
# deploy.sh - Script de despliegue para producción

echo "🚀 Iniciando despliegue en producción..."

# Configurar variables de entorno
export DJANGO_SETTINGS_MODULE=mysite.production_settings
export DJANGO_SECRET_KEY="$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')"

# Configuración de base de datos
export DB_NAME="postgres"
export DB_USER="postgres"
export DB_PASSWORD="andrea2025"
export DB_HOST="146.83.194.142"
export DB_PORT="1774"

echo "📦 Instalando dependencias..."
pip install -r requirements.txt

echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --settings=mysite.production_settings

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --settings=mysite.production_settings

echo "👤 Crear superusuario (opcional)..."
# python manage.py createsuperuser --settings=mysite.production_settings

echo "🔧 Configuración completada!"
echo "🌐 Para iniciar el servidor:"
echo "   python manage.py runserver 0.0.0.0:8000 --settings=mysite.production_settings"
echo ""
echo "🔗 Tu aplicación estará disponible en:"
echo "   http://146.83.194.142:8000"