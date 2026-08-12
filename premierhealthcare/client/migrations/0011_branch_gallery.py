from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0009_doctor_position_fee'),
        ('files', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BranchGallery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, default='', max_length=150)),
                ('title_ar', models.CharField(blank=True, default='', max_length=150)),
                ('description', models.TextField(blank=True, default='')),
                ('description_ar', models.TextField(blank=True, default='')),
                ('order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='branch_gallery_images', to='client.branch')),
                ('image', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='branch_gallery_files', to='files.file')),
            ],
            options={
                'verbose_name_plural': 'branch galleries',
                'ordering': ['order', '-created_at'],
            },
        ),
    ]
