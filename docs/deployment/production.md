# Production Deployment Guide

## Overview

This guide covers deploying EmotionalChain to a production environment with proper security, monitoring, and high availability. EmotionalChain requires specialized infrastructure to support biometric device integration and real-time consensus operations.

## Infrastructure Requirements

### Minimum Production Setup

#### Single Node (Development/Testing)
- **CPU**: 4 cores, 3.0+ GHz
- **RAM**: 8 GB
- **Storage**: 100 GB NVMe SSD
- **Network**: 100 Mbps with low latency
- **OS**: Ubuntu 20.04+ LTS

#### Validator Node (Production)
- **CPU**: 8+ cores, 3.5+ GHz  
- **RAM**: 16+ GB
- **Storage**: 500+ GB NVMe SSD
- **Network**: 1 Gbps with < 50ms latency
- **Backup**: Automated daily backups
- **Uptime**: 99.9% SLA requirement

#### Full Production Cluster
- **Load Balancer**: 2x nodes (HA proxy)
- **Application Servers**: 3+ nodes (horizontal scaling)
- **Database**: PostgreSQL cluster (primary + 2 replicas)
- **Monitoring**: Dedicated observability stack
- **CDN**: Global content delivery network

### Network Architecture

```
Internet
    ↓
Load Balancer (HA)
    ↓
Application Cluster (3+ nodes)
    ↓
Database Cluster (Primary + Replicas)
    ↓
Blockchain P2P Network
```

## Server Setup

### Ubuntu Server Configuration

#### 1. System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop unzip

# Configure timezone
sudo timedatectl set-timezone UTC

# Set up firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000  # Application port
sudo ufw allow 30303 # P2P network port
```

#### 2. Node.js Installation
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 8.x.x

# Install PM2 process manager
sudo npm install -g pm2
```

#### 3. PostgreSQL Installation
```bash
# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create production database
sudo -u postgres createdb emotionalchain_prod
sudo -u postgres createuser emotionalchain

# Set password and permissions
sudo -u postgres psql -c "ALTER USER emotionalchain PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emotionalchain_prod TO emotionalchain;"
```

### Application Deployment

#### 1. Code Deployment
```bash
# Create application directory
sudo mkdir -p /opt/emotionalchain
sudo chown $USER:$USER /opt/emotionalchain

# Clone repository
cd /opt/emotionalchain
git clone https://github.com/emotionalchain/emotionalchain.git .

# Install dependencies
npm ci --production

# Build application
npm run build
```

#### 2. Environment Configuration
```bash
# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL="postgresql://emotionalchain:your_secure_password@localhost:5432/emotionalchain_prod"
PGHOST=localhost
PGPORT=5432
PGUSER=emotionalchain
PGPASSWORD=your_secure_password
PGDATABASE=emotionalchain_prod

# Security Configuration
JWT_SECRET="your_jwt_secret_key_min_32_chars"
SESSION_SECRET="your_session_secret_key_min_32_chars"

# Network Configuration
P2P_PORT=30303
WEBSOCKET_PORT=5001
HOST=0.0.0.0

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/emotionalchain/app.log
EOF

# Secure environment file
chmod 600 .env.production
```

#### 3. Database Setup
```bash
# Push database schema
npm run db:push

# Verify database connection
npm run db:verify
```

#### 4. PM2 Configuration
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'emotionalchain',
    script: 'dist/index.js',
    cwd: '/opt/emotionalchain',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '2G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    log_file: '/var/log/emotionalchain/combined.log',
    out_file: '/var/log/emotionalchain/out.log',
    error_file: '/var/log/emotionalchain/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/emotionalchain
sudo chown $USER:$USER /var/log/emotionalchain

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

## SSL/TLS Configuration

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/emotionalchain << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:5000;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:5000;
    }
}

# Rate limiting zones
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/emotionalchain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## High Availability Setup

### Database Clustering

#### PostgreSQL Primary-Replica Setup

```bash
# Primary server configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
hot_standby = on

# Create replication user
sudo -u postgres psql -c "CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 3 ENCRYPTED PASSWORD 'replication_password';"

# Configure pg_hba.conf for replication
echo "host replication replicator replica_ip/32 md5" | sudo tee -a /etc/postgresql/14/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Replica Server Setup

```bash
# Stop PostgreSQL on replica
sudo systemctl stop postgresql

# Create base backup
sudo -u postgres pg_basebackup -h primary_ip -D /var/lib/postgresql/14/main -U replicator -v -P -W

# Create recovery.conf
sudo -u postgres cat > /var/lib/postgresql/14/main/recovery.conf << EOF
standby_mode = 'on'
primary_conninfo = 'host=primary_ip port=5432 user=replicator password=replication_password'
restore_command = 'cp /var/lib/postgresql/14/main/pg_xlog/%f %p'
archive_cleanup_command = 'pg_archivecleanup /var/lib/postgresql/14/main/pg_xlog %r'
EOF

# Start replica
sudo systemctl start postgresql
```

### Load Balancer Configuration

#### HAProxy Setup

```bash
# Install HAProxy
sudo apt install -y haproxy

# Configure HAProxy
sudo cat > /etc/haproxy/haproxy.cfg << 'EOF'
global
    daemon
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy

    # SSL Configuration
    ssl-default-bind-ciphers ECDHE+AESGCM:ECDHE+CHACHA20:!aNULL:!MD5:!DSS
    ssl-default-bind-options no-sslv3 no-tlsv10 no-tlsv11

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog
    option dontlognull

# Frontend
frontend emotionalchain_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/emotionalchain.pem
    redirect scheme https if !{ ssl_fc }
    
    # Health check
    acl health_check path /health
    http-request return status 200 if health_check
    
    default_backend emotionalchain_backend

# Backend
backend emotionalchain_backend
    balance roundrobin
    option httpchk GET /health
    
    server app1 10.0.1.10:5000 check
    server app2 10.0.1.11:5000 check
    server app3 10.0.1.12:5000 check

# Stats interface
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
EOF

# Start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy
```

## Monitoring and Observability

### Prometheus Configuration

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xf prometheus-2.40.0.linux-amd64.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus
sudo ln -s /opt/prometheus/prometheus /usr/local/bin/

# Create Prometheus configuration
sudo mkdir -p /etc/prometheus
sudo cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "emotionalchain_rules.yml"

scrape_configs:
  - job_name: 'emotionalchain'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
EOF

# Create systemd service
sudo cat > /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
WorkingDirectory=/opt/prometheus
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.console.templates=/opt/prometheus/consoles \
    --web.console.libraries=/opt/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create prometheus user and directories
sudo useradd --no-create-home --shell /bin/false prometheus
sudo mkdir -p /var/lib/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus
sudo chown -R prometheus:prometheus /etc/prometheus

# Start Prometheus
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus
```

### Grafana Installation

```bash
# Install Grafana
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt update
sudo apt install -y grafana

# Start Grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Access Grafana at http://your-server:3000
# Default login: admin/admin
```

### Log Aggregation

```bash
# Install Filebeat for log shipping
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list
sudo apt update
sudo apt install filebeat

# Configure Filebeat
sudo cat > /etc/filebeat/filebeat.yml << 'EOF'
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/emotionalchain/*.log
  fields:
    service: emotionalchain
  fields_under_root: true

output.logstash:
  hosts: ["your-logstash-server:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
EOF

# Start Filebeat
sudo systemctl enable filebeat
sudo systemctl start filebeat
```

## Security Hardening

### System Security

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Configure SSH key authentication only
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd

# Install fail2ban
sudo apt install -y fail2ban

# Configure fail2ban
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Application Security

```bash
# Create dedicated user for application
sudo useradd --system --shell /bin/false --home /opt/emotionalchain emotionalchain
sudo chown -R emotionalchain:emotionalchain /opt/emotionalchain

# Set up proper file permissions
sudo chmod 644 /opt/emotionalchain/.env.production
sudo chmod -R 755 /opt/emotionalchain
sudo chmod -R 644 /opt/emotionalchain/dist

# Configure application to run as non-root
sudo pm2 delete all
sudo pm2 start ecosystem.config.js --user emotionalchain
```

## Backup and Recovery

### Database Backup

```bash
# Create backup script
sudo cat > /opt/emotionalchain/scripts/backup.sh << 'EOF'
#!/bin/bash

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup/emotionalchain"
DATABASE="emotionalchain_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U emotionalchain -d $DATABASE > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /opt/emotionalchain .

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

# Make script executable
sudo chmod +x /opt/emotionalchain/scripts/backup.sh

# Set up cron job for daily backups
echo "0 2 * * * /opt/emotionalchain/scripts/backup.sh" | sudo crontab -
```

### Disaster Recovery

```bash
# Create recovery script
sudo cat > /opt/emotionalchain/scripts/restore.sh << 'EOF'
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Stop application
pm2 stop all

# Drop and recreate database
sudo -u postgres dropdb emotionalchain_prod
sudo -u postgres createdb emotionalchain_prod

# Restore database
gunzip -c $BACKUP_FILE | psql -h localhost -U emotionalchain -d emotionalchain_prod

# Restart application
pm2 start ecosystem.config.js

echo "Recovery completed"
EOF

# Make script executable
sudo chmod +x /opt/emotionalchain/scripts/restore.sh
```

## Performance Optimization

### Database Optimization

```sql
-- PostgreSQL configuration optimizations
-- Add to postgresql.conf

# Memory settings
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Connection settings
max_connections = 200

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_blocks_height ON blocks(height);
CREATE INDEX CONCURRENTLY idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX CONCURRENTLY idx_validator_states_emotional_score ON validator_states(emotional_score);
CREATE INDEX CONCURRENTLY idx_biometric_data_validator_timestamp ON biometric_data(validator_id, timestamp);
```

### Application Optimization

```bash
# Node.js production optimizations
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=16

# PM2 cluster optimization
pm2 start ecosystem.config.js --instances max --exec-mode cluster
```

## Deployment Checklist

### Pre-Deployment
- [ ] Server provisioned with adequate resources
- [ ] Operating system updated and hardened
- [ ] Firewall configured correctly
- [ ] SSL certificates obtained and configured
- [ ] Database cluster set up and tested
- [ ] Monitoring and logging configured
- [ ] Backup procedures tested
- [ ] Load balancer configured (if applicable)

### Deployment
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] Dependencies installed
- [ ] Application built for production
- [ ] PM2 configuration applied
- [ ] Nginx/reverse proxy configured
- [ ] Health checks passing

### Post-Deployment
- [ ] Application accessible via HTTPS
- [ ] WebSocket connections working
- [ ] API endpoints responding correctly
- [ ] Database connections stable
- [ ] Monitoring dashboards showing data
- [ ] Log aggregation working
- [ ] Backup procedures validated
- [ ] Performance metrics within acceptable ranges
- [ ] Security scan completed
- [ ] Load testing performed (if applicable)

### Validator-Specific Checks
- [ ] Biometric device integration tested
- [ ] P2P network connectivity confirmed
- [ ] Consensus participation active
- [ ] Emotional score calculation working
- [ ] Mining rewards being received
- [ ] Staking mechanisms functional

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs emotionalchain

# Check system logs
sudo journalctl -u emotionalchain -f

# Verify environment variables
pm2 show emotionalchain
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U emotionalchain -d emotionalchain_prod -c "SELECT version();"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Verify network connectivity
telnet localhost 5432
```

#### Performance Issues
```bash
# Monitor system resources
htop
iotop
netstat -tulpn

# Check application metrics
curl http://localhost:5000/metrics

# Analyze database performance
psql -c "SELECT * FROM pg_stat_activity;"
```

### Support Resources

- **Documentation**: Complete deployment guides
- **Community**: Discord and GitHub discussions
- **Professional Support**: Enterprise support available
- **Monitoring**: 24/7 infrastructure monitoring

This production deployment guide ensures a secure, scalable, and highly available EmotionalChain network deployment suitable for enterprise use.