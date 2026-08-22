# Generated for attribution tracking and offline conversions

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0012_doctor_stats'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending_payment', 'Pending Payment'),
                    ('pending', 'Pending'),
                    ('confirmed', 'Confirmed'),
                    ('cancelled', 'Cancelled'),
                    ('completed', 'Completed'),
                    ('attended', 'Attended'),
                    ('expired', 'Expired'),
                ],
                default='pending_payment',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='utm_source',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='utm_medium',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='utm_campaign',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='utm_content',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='utm_term',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='campaign_id',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='adset_id',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='ad_id',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='gclid',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='gbraid',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='wbraid',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='fbclid',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='ttclid',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='sc_click_id',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='landing_page',
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='referrer',
            field=models.CharField(blank=True, max_length=2000, null=True),
        ),
        migrations.CreateModel(
            name='OfflineConversion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_name', models.CharField(choices=[('appointment_attended', 'Appointment Attended'), ('purchase', 'Purchase')], max_length=100)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('sent', 'Sent'), ('failed', 'Failed')], default='pending', max_length=50)),
                ('value', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('currency', models.CharField(default='EGP', max_length=10)),
                ('conversion_time', models.DateTimeField(auto_now_add=True)),
                ('utm_source', models.CharField(blank=True, max_length=500, null=True)),
                ('utm_campaign', models.CharField(blank=True, max_length=500, null=True)),
                ('gclid', models.CharField(blank=True, max_length=500, null=True)),
                ('fbclid', models.CharField(blank=True, max_length=500, null=True)),
                ('ttclid', models.CharField(blank=True, max_length=500, null=True)),
                ('sc_click_id', models.CharField(blank=True, max_length=500, null=True)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offline_conversions', to='client.booking')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('booking', 'event_name')},
            },
        ),
    ]
