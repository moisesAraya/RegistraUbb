# Generated manually to remove Asistencia table and references

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('modlector', '0003_alter_marcaje_createdat_alter_marcaje_updatedat'),
    ]

    operations = [
        # Remove foreign key constraint from Notificacion to Asistencia
        migrations.RemoveField(
            model_name='notificacion',
            name='id_asist',
        ),
        
        # Drop the Asistencia table completely
        migrations.DeleteModel(
            name='Asistencia',
        ),
    ]