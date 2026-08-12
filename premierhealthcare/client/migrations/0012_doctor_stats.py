from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0011_branch_gallery'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='experience',
            field=models.PositiveIntegerField(blank=True, default=10, help_text='Years of Experience', null=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='patients',
            field=models.PositiveIntegerField(blank=True, default=500, help_text='Number of Patients Served', null=True),
        ),
        migrations.AddField(
            model_name='doctor',
            name='languages',
            field=models.CharField(blank=True, default='English, Arabic', help_text='Languages spoken (comma-separated)', max_length=250, null=True),
        ),
    ]
