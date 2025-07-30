# EmotionalChain Deployment Guide

## Prerequisites

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB SSD minimum
- **Network**: Stable internet connection with low latency

### Software Requirements
- **Node.js**: v20.19.3 or higher
- **PostgreSQL**: v14 or higher
- **Docker**: v24+ (optional but recommended)

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/emotionalchain/blockchain
cd emotionalchain
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env` file:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/emotionalchain
PORT=5000
DOMAIN=emotionalchain.com
```

### 4. Database Setup
```bash
# Create database
createdb emotionalchain

# Run migrations
npm run db:push
```

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Build Application
```bash
npm run build
```

#### 2. Start Production Server
```bash
npm run start
```

#### 3. Process Management (PM2)
```bash
npm install -g pm2
pm2 start dist/index.js --name "emotionalchain"
pm2 startup
pm2 save
```

### Option 2: Docker Deployment

#### 1. Build Docker Image
```bash
docker build -t emotionalchain:latest .
```

#### 2. Run Container
```bash
docker run -d \
  --name emotionalchain \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:password@db:5432/emotionalchain \
  emotionalchain:latest
```

#### 3. Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/emotionalchain
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=emotionalchain
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Start with:
```bash
docker-compose up -d
```

## Load Balancer Configuration

### Nginx Configuration
```nginx
upstream emotionalchain {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001; # Add more instances for scaling
}

server {
    listen 80;
    server_name emotionalchain.com;
    
    location / {
        proxy_pass http://emotionalchain;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://emotionalchain;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

## SSL/TLS Setup

### Using Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d emotionalchain.com
```

## Monitoring Setup

### 1. Health Check Endpoint
The application provides health checks at:
```
GET /api/network/status
```

### 2. Process Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
iostat -x 1
```

### 3. Database Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('emotionalchain'));
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 5000   # Block direct app access
sudo ufw enable
```

### 2. Database Security
- Use strong passwords
- Enable SSL connections
- Restrict database access to application servers only
- Regular backups with encryption

### 3. Application Security
- Keep dependencies updated
- Use environment variables for secrets
- Enable rate limiting
- Monitor for suspicious activity

## Backup Strategy

### 1. Database Backup
```bash
# Daily backup script
#!/bin/bash
pg_dump emotionalchain | gzip > "backup-$(date +%Y%m%d).sql.gz"

# Upload to secure storage
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://emotionalchain-backups/
```

### 2. Application Backup
- Version control for code
- Configuration file backups
- Log file rotation and archiving

## Scaling Considerations

### Horizontal Scaling
- Load balancer with multiple app instances
- Database read replicas
- Redis caching layer

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Enable connection pooling

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL
   - Verify PostgreSQL is running
   - Check firewall rules

2. **WebSocket Connection Issues**
   - Verify proxy configuration
   - Check port availability
   - Test direct connection

3. **High Memory Usage**
   - Monitor Node.js heap
   - Check for memory leaks
   - Restart application if needed

### Log Locations
- Application logs: `logs/app.log`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_blocks_height ON blocks(height);
CREATE INDEX idx_transactions_timestamp ON transactions(created_at);
```

### Application Optimization
- Enable gzip compression
- Implement API response caching
- Use connection pooling
- Optimize database queries

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Rotate logs weekly
- Backup database daily
- Monitor disk space
- Review security logs

### Update Process
1. Test updates in staging
2. Schedule maintenance window
3. Create backup
4. Deploy updates
5. Verify functionality
6. Monitor performance

This deployment guide ensures EmotionalChain runs reliably in production with proper security, monitoring, and scalability considerations.