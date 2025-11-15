from django.apps import AppConfig


class ModlectorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'modlector'

    def ready(self):
        #import modlector.signals
        pass