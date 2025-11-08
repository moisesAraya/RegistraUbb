#!/bin/bash
# filepath: c:\Users\andre\Documents\Universidad\PROYECTO DE TITULO\RegistraUBB\RegistraUbb\lector\deploy.sh
echo "🚀 Desplegando Django con SSL en servidor..."

# Ir al directorio del proyecto
cd /root/RegistraUbb/lector

# Activar entorno virtual
source venv/bin/activate

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
sudo mkdir -p /var/log/django
sudo chown $USER:$USER /var/log/django

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
python manage.py check --deploy

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl reload nginx
sudo pkill -f gunicorn || true

echo "✅ Despliegue completado!"
echo ""
echo "Para iniciar Gunicorn ejecuta:"
echo "bash start_gunicorn.sh"
echo ""
echo "🔗 Tu aplicación estará en: https://146.83.194.142"