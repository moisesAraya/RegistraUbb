# production_settings.py
# Configuraciones específicas para producción

import os
from .settings import *

# Modo producción
DEBUG = False

# Hosts permitidos
ALLOWED_HOSTS = [
    '146.83.194.142',  # Tu IP del servidor
    'localhost',
    '127.0.0.1',
]

# Secret key para producción (generar una nueva)
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-g-xo9*6zdqi0+39a!!*(kb$=$+d*bmt@grp1n4*b_h)#6z9c1q')

# Base de datos para producción (ajustar según tu setup)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.environ.get('DB_NAME', 'postgres'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'andrea2025'),
        'HOST': os.environ.get('DB_HOST', '146.83.194.142'),
        'PORT': os.environ.get('DB_PORT', '1774'),
    }
}

# Configuraciones de archivos estáticos
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Logging para producción
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/django.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}