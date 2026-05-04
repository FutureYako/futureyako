# Generated migration for adding routing_preference field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('autosave', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='savingpreference',
            name='routing_preference',
            field=models.CharField(
                choices=[('wallet', 'Savings Wallet'), ('invest', 'Direct to Investment')],
                default='wallet',
                max_length=20
            ),
        ),
    ]
