#!/bin/bash
# filepath: c:\Users\andre\Documents\Universidad\PROYECTO DE TITULO\RegistraUBB\RegistraUbb\lector\deploy.sh
echo "🚀 Desplegando Django con HTTP en servidor..."

echo "🚀 Desplegando Django en servidor..."

# Configurar variables de entorno
export DJANGO_SETTINGS_MODULE=mysite.settings

# Instalar/actualizar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar migraciones
echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --settings=mysite.settings

# Verificar configuración de Django
echo "🔍 Verificando configuración..."
python manage.py check

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar el servidor Django ejecuta:"
echo "bash start_gunicorn.sh"
echo ""
echo "🔗 Tu aplicación estará en: http://146.83.194.142:8000"
