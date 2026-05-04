import paramiko, time, sys

HOST = '173.212.247.220'
USER = 'root'
PASS = 'Softwares2026'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=20)
print('Connected!')

def run(label, cmd, timeout=180):
    print(f'\n--- {label} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(out[-1000:].encode('ascii', errors='replace').decode())
    if err and code != 0: print('STDERR:', err[-500:].encode('ascii', errors='replace').decode())
    print(f'exit={code}')
    return code

run('apt update', 'apt-get update -qq', 120)
run('install packages', 'DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-pip python3-venv postgresql postgresql-contrib redis-server nginx git curl build-essential libpq-dev python3-dev certbot python3-certbot-nginx', 360)
run('start services', 'systemctl enable postgresql redis-server && systemctl start postgresql redis-server')
run('pg create user', "sudo -u postgres psql -c \"CREATE USER savewise WITH PASSWORD 'SaveWise_DB_2026!';\" 2>/dev/null; echo ok")
run('pg create db', "sudo -u postgres psql -c \"CREATE DATABASE savewise OWNER savewise;\" 2>/dev/null; echo ok")
run('pg grant', "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE savewise TO savewise;\" 2>/dev/null; echo ok")
run('clone repo', 'rm -rf /var/www/futureyako && git clone https://github.com/FutureYako/futureyako.git /var/www/futureyako', 120)
run('ls backend', 'ls /var/www/futureyako/backend')
run('create venv', 'cd /var/www/futureyako/backend && python3 -m venv venv', 60)
run('upgrade pip', 'cd /var/www/futureyako/backend && venv/bin/pip install --upgrade pip -q', 60)

client.close()
print('\n=== Phase 1 complete ===')
