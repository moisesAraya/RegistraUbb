#!/bin/bash
<<<<<<< HEAD
# deploy.sh - Script de despliegue simple para servidor SSH
=======
# filepath: c:\Users\andre\Documents\Universidad\PROYECTO DE TITULO\RegistraUBB\RegistraUbb\lector\deploy.sh
echo "🚀 Desplegando Django con HTTP en servidor..."
>>>>>>> a483ff9a50efbd784ab6eabf95488bc5be16bb85

echo "🚀 Desplegando Django en servidor..."

# Configurar variables de entorno
export DJANGO_SETTINGS_MODULE=mysite.settings

<<<<<<< HEAD
# Instalar dependencias
=======
# Instalar/actualizar dependencias
>>>>>>> a483ff9a50efbd784ab6eabf95488bc5be16bb85
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Ejecutar migraciones
echo "🗃️ Ejecutando migraciones..."
python manage.py migrate --settings=mysite.settings

<<<<<<< HEAD
# Recolectar archivos estáticos
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --settings=mysite.settings

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar el servidor ejecuta:"
echo "gunicorn mysite.wsgi:application --bind 0.0.0.0:443 --workers 3 --env DJANGO_SETTINGS_MODULE=mysite.settings"
echo ""
echo "🔗 Tu aplicación estará en: http://146.83.194.142:1779"
=======
# Verificar configuración de Django
echo "🔍 Verificando configuración..."
python manage.py check

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar el servidor Django ejecuta:"
echo "bash start_gunicorn.sh"
echo ""
echo "🔗 Tu aplicación estará en: http://146.83.194.142:8000"
>>>>>>> a483ff9a50efbd784ab6eabf95488bc5be16bb85
