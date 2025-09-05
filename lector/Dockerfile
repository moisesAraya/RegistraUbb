# Dockerfile para proyecto Django con SQLite
FROM python:3.12-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto al contenedor
COPY . /app

# Instala dependencias si existe requirements.txt
RUN pip install --upgrade pip \
    && if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Expone el puerto por defecto de Django
EXPOSE 8000

# Comando por defecto para correr el servidor de desarrollo
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
