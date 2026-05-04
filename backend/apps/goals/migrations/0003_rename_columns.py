from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('goals', '0002_auto_20260501_1856'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[],
            database_operations=[
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN goal_type TO "type"', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN target_amount TO target', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN current_amount TO current', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN is_locked TO locked', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN group_subtype TO "groupSubType"', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN contribution_model TO "contributionModel"', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN withdrawal_control TO "withdrawalControl"', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals RENAME COLUMN invitation_code TO code', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals DROP COLUMN weight_type', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals DROP COLUMN weight_value', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals ADD COLUMN weight VARCHAR(20) NOT NULL DEFAULT "0%"', migrations.RunSQL.noop),
                migrations.RunSQL('ALTER TABLE goals ADD COLUMN "myContribution" DECIMAL(12,2) NOT NULL DEFAULT 0', migrations.RunSQL.noop),
            ],
        ),
    ]
