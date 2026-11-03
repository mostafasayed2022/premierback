from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("client", "0015_customuser_is_guest"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="cybersource_transaction_id",
            field=models.CharField(
                max_length=100,
                blank=True,
                null=True,
                db_index=True,
            ),
        ),
    ]
