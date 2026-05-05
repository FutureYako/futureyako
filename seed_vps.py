import paramiko, os, subprocess, sys

HOST = '173.212.247.220'
USER = 'root'
PASS = 'Softwares2026'

PYTHON_LOCAL = r'C:\Users\dauso\dauson\Scripts\python.exe'
MANAGE_LOCAL = r'c:\Users\dauso\future_yako\backend\manage.py'
FIXTURE_LOCAL = r'c:\Users\dauso\future_yako\backend\fixture_seed.json'
FIXTURE_REMOTE = '/var/www/futureyako/backend/fixture_seed.json'

# ── Step 1: Dump local data ───────────────────────────────────────────────────
print('=== Dumping local data ===')
result = subprocess.run([
    PYTHON_LOCAL, MANAGE_LOCAL, 'dumpdata',
    '--settings=config.settings.development',
    '--natural-foreign',
    '--natural-primary',
    '--exclude=contenttypes',
    '--exclude=auth.permission',
    '--exclude=sessions',
    '--exclude=admin.logentry',
    '--exclude=token_blacklist',
    '--exclude=django_celery_beat',
    '--exclude=django_celery_results',
    '--indent=2',
    '-o', FIXTURE_LOCAL,
], capture_output=True, text=True, cwd=r'c:\Users\dauso\future_yako\backend')

if result.returncode != 0:
    print('STDERR:', result.stderr[-500:])
    sys.exit(1)

size = os.path.getsize(FIXTURE_LOCAL) / 1024
print(f'Fixture created: {size:.1f} KB')

# ── Step 2: Connect to VPS ────────────────────────────────────────────────────
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=20)
print('Connected to VPS')

def run(label, cmd, timeout=120):
    print(f'\n--- {label} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(out[-1500:].encode('ascii', errors='replace').decode())
    if err and code != 0: print('STDERR:', err[-400:].encode('ascii', errors='replace').decode())
    print(f'exit={code}')
    return code

BASE_DIR = 'cd /var/www/futureyako/backend'
PYTHON = 'DJANGO_SETTINGS_MODULE=config.settings.production venv/bin/python'
BASE = f'{BASE_DIR} && {PYTHON} manage.py'

# ── Step 3: Upload fixture ────────────────────────────────────────────────────
print('\n=== Uploading fixture to VPS ===')
sftp = client.open_sftp()
sftp.put(FIXTURE_LOCAL, FIXTURE_REMOTE)
sftp.close()
print('Uploaded.')

# ── Step 4: Flush VPS DB (remove existing data) ───────────────────────────────
print('\n=== Flushing VPS database ===')
run('flush', f'{BASE} flush --no-input 2>&1')

# ── Step 5: Load fixture with signals disabled ────────────────────────────────
# The post_save signal on User auto-creates UserSettings/NotificationPreference/
# TwoFactorAuth/OnboardingProgress. We disconnect it so loaddata can insert the
# actual values from the fixture without hitting unique-constraint violations.
load_cmd = (
    f'{BASE_DIR} && {PYTHON} -c "'
    'import django; django.setup(); '
    'from django.db.models.signals import post_save; '
    'from apps.accounts.models import User; '
    'from apps.accounts.signals import create_user_related_records; '
    'post_save.disconnect(create_user_related_records, sender=User); '
    'from django.core.management import call_command; '
    'call_command(\'loaddata\', \'fixture_seed.json\', verbosity=1); '
    '" 2>&1'
)
run('loaddata (signals disabled)', load_cmd, 180)

# ── Step 6: Verify ────────────────────────────────────────────────────────────
run('count users',        f'{BASE} shell -c "from apps.accounts.models import User; print(User.objects.count(), \'users\')" 2>&1')
run('count wallets',      f'{BASE} shell -c "from apps.wallets.models import Wallet; print(Wallet.objects.count(), \'wallets\')" 2>&1')
run('count transactions', f'{BASE} shell -c "from apps.transactions.models import Transaction; print(Transaction.objects.count(), \'transactions\')" 2>&1')

# Cleanup
run('remove fixture', 'rm /var/www/futureyako/backend/fixture_seed.json')
os.remove(FIXTURE_LOCAL)
client.close()
print('\n=== Done — local data is now on VPS ===')
