from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0008_patient_gender'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='position',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='consultation_fee',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
        migrations.AlterField(
            model_name='doctor',
            name='license_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
