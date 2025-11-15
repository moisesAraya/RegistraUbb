#!/bin/bash
# filepath: c:\Users\andre\Documents\Universidad\PROYECTO DE TITULO\RegistraUBB\RegistraUbb\lector\deploy.sh
echo "🚀 Desplegando Django con HTTP en servidor..."

# Ir al directorio del proyecto
cd /root/RegistraUbb/lector

# Activar entorno virtual
source venv/bin/activate

# Instalar/actualizar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Recolectar archivos estáticos
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

# Ejecutar migraciones
echo "🗃️ Ejecutando migraciones..."
python manage.py migrate

# Verificar configuración de Django
echo "🔍 Verificando configuración..."
python manage.py check

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar el servidor Django ejecuta:"
echo "bash start_gunicorn.sh"
echo ""
echo "🔗 Tu aplicación estará en: http://146.83.194.142:80"