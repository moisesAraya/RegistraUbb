# Dockerfile para Django en producción
FROM python:3.11-slim

# Configurar directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Configurar variables de entorno
ENV DJANGO_SETTINGS_MODULE=mysite.production_settings
ENV PYTHONUNBUFFERED=1

# Crear directorio para logs
RUN mkdir -p /var/log/django

# Recolectar archivos estáticos
RUN python manage.py collectstatic --noinput --settings=mysite.production_settings

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000", "--settings=mysite.production_settings"]