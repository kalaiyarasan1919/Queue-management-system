# SmartQueue Reminder Service - Deployment Guide

This guide will help you deploy the Django-based reminder service alongside your existing Node.js SmartQueue application.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Node.js App   │    │  Django Service  │    │   MongoDB       │
│   (Frontend)    │◄──►│  (Reminders)     │◄──►│   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │     Redis       │
         │              │   (Celery)      │
         └──────────────►└─────────────────┘
```

## 🚀 Quick Start (Local Development)

### 1. Prerequisites

- Python 3.11+
- Node.js (your existing setup)
- MongoDB (your existing database)
- Redis
- PostgreSQL (for Django)

### 2. Setup Django Reminder Service

```bash
cd SmartQueue/django_reminder_service

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp env.example .env
# Edit .env with your configuration

# Setup database
python manage.py migrate
python manage.py setup_reminder_service

# Start services
redis-server &
celery -A reminder_service worker --loglevel=info &
celery -A reminder_service beat --loglevel=info &
python manage.py runserver
```

### 3. Test the Integration

```bash
# Test health check
curl http://localhost:8000/api/health/

# Test email system
curl -X POST http://localhost:8000/api/test-email/

# Get statistics
curl http://localhost:8000/api/stats/
```

## 🌐 Production Deployment

### Option 1: Railway Deployment (Recommended)

Railway is perfect for this setup because it supports multiple services and databases.

#### 1. Prepare for Railway

```bash
# In your SmartQueue directory
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/smartqueue.git
git push -u origin main
```

#### 2. Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Create two services:
   - **SmartQueue-API** (Node.js)
   - **SmartQueue-Reminders** (Django)

#### 3. Configure Services

**SmartQueue-API Service:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URL=your-mongodb-url
REMINDER_SERVICE_URL=https://smartqueue-reminders-production.up.railway.app
```

**SmartQueue-Reminders Service:**
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=smartqueue-reminders-production.up.railway.app
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=5432
MONGODB_URL=your-mongodb-url
MONGODB_DB=smartqueue
MONGODB_COLLECTION=appointments
CELERY_BROKER_URL=redis://default:password@containers-us-west-xxx.railway.app:6379
CELERY_RESULT_BACKEND=redis://default:password@containers-us-west-xxx.railway.app:6379
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@smartqueue.com
```

#### 4. Add Redis Service

1. In Railway dashboard, add Redis service
2. Update `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` with Redis URL

#### 5. Deploy

Railway will automatically detect and deploy both services.

### Option 2: Heroku Deployment

#### 1. Prepare for Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create apps
heroku create smartqueue-api
heroku create smartqueue-reminders
```

#### 2. Configure Heroku Apps

**API App:**
```bash
heroku config:set NODE_ENV=production -a smartqueue-api
heroku config:set MONGODB_URL=your-mongodb-url -a smartqueue-api
heroku config:set REMINDER_SERVICE_URL=https://smartqueue-reminders.herokuapp.com -a smartqueue-api
```

**Reminders App:**
```bash
heroku config:set DEBUG=False -a smartqueue-reminders
heroku config:set SECRET_KEY=your-secret-key -a smartqueue-reminders
heroku config:set MONGODB_URL=your-mongodb-url -a smartqueue-reminders
heroku config:set EMAIL_HOST_USER=your-email@gmail.com -a smartqueue-reminders
heroku config:set EMAIL_HOST_PASSWORD=your-app-password -a smartqueue-reminders
```

#### 3. Add Add-ons

```bash
# Add PostgreSQL to reminders app
heroku addons:create heroku-postgresql:mini -a smartqueue-reminders

# Add Redis to reminders app
heroku addons:create heroku-redis:mini -a smartqueue-reminders
```

#### 4. Deploy

```bash
# Deploy API
git subtree push --prefix=SmartQueue heroku-api main

# Deploy Reminders
git subtree push --prefix=SmartQueue/django_reminder_service heroku-reminders main
```

### Option 3: Docker Deployment

#### 1. Create Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
      - reminders

  api:
    build: ./SmartQueue
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongo:27017/smartqueue
      - REMINDER_SERVICE_URL=http://reminders:8000
    depends_on:
      - mongo
      - redis

  reminders:
    build: ./SmartQueue/django_reminder_service
    environment:
      - DEBUG=False
      - MONGODB_URL=mongodb://mongo:27017/smartqueue
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
      - mongo

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=reminder_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  postgres_data:
  mongo_data:
```

#### 2. Deploy with Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

#### Node.js App
```env
NODE_ENV=production
PORT=5000
MONGODB_URL=mongodb://localhost:27017/smartqueue
REMINDER_SERVICE_URL=http://localhost:8000
```

#### Django Reminder Service
```env
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DB_NAME=reminder_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
MONGODB_URL=mongodb://localhost:27017/
MONGODB_DB=smartqueue
MONGODB_COLLECTION=appointments
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@smartqueue.com
```

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Enable 2FA

2. **Generate App Password**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Use this password in `EMAIL_HOST_PASSWORD`

3. **Test Email**
   ```bash
   curl -X POST https://your-reminder-service.com/api/test-email/
   ```

## 📊 Monitoring

### Health Checks

```bash
# API Health
curl https://your-api.com/api/health/

# Reminder Service Health
curl https://your-reminder-service.com/api/health/

# Reminder Statistics
curl https://your-reminder-service.com/api/stats/
```

### Logs

#### Railway
- Go to Railway dashboard
- Click on your service
- View logs in real-time

#### Heroku
```bash
# View logs
heroku logs --tail -a smartqueue-api
heroku logs --tail -a smartqueue-reminders

# View specific logs
heroku logs --tail --source app -a smartqueue-reminders
```

#### Docker
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs reminders
docker-compose logs api
```

### Celery Monitoring

```bash
# Install Flower
pip install flower

# Start Flower
celery -A reminder_service flower

# Access at http://localhost:5555
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Reminder Service Not Starting
```bash
# Check logs
docker-compose logs reminders

# Check database connection
python manage.py dbshell

# Check Redis connection
redis-cli ping
```

#### 2. Emails Not Sending
```bash
# Test email configuration
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])

# Check SMTP settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.EMAIL_HOST, settings.EMAIL_PORT)
```

#### 3. Celery Tasks Not Running
```bash
# Check Celery status
celery -A reminder_service inspect active

# Check scheduled tasks
celery -A reminder_service inspect scheduled

# Restart Celery
docker-compose restart reminders
```

#### 4. MongoDB Connection Issues
```bash
# Test MongoDB connection
python manage.py shell
>>> from reminders.mongodb_client import mongodb_client
>>> appointments = mongodb_client.get_appointments_for_reminder()
>>> print(len(appointments))
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes to PostgreSQL
CREATE INDEX idx_reminder_logs_appointment_date ON reminder_logs(appointment_date);
CREATE INDEX idx_reminder_logs_reminder_sent ON reminder_logs(reminder_sent);
CREATE INDEX idx_reminder_logs_user_email ON reminder_logs(user_email);
```

#### 2. Celery Optimization
```python
# In settings.py
CELERY_WORKER_CONCURRENCY = 4
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
```

#### 3. Email Optimization
```python
# Batch email sending
CELERY_TASK_ROUTES = {
    'reminders.tasks.send_reminder_email': {'queue': 'emails'},
}
```

## 🔒 Security

### Production Security Checklist

- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use HTTPS
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup strategy

### SSL/HTTPS Setup

#### Railway
- Automatic HTTPS with custom domains
- SSL certificates managed automatically

#### Heroku
- Automatic HTTPS for *.herokuapp.com
- Custom domains need SSL add-on

#### Docker/Nginx
```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://api:5000;
    }
    
    location /reminders/ {
        proxy_pass http://reminders:8000;
    }
}
```

## 📈 Scaling

### Horizontal Scaling

#### Railway
- Enable auto-scaling in Railway dashboard
- Set minimum and maximum instances

#### Heroku
```bash
# Scale web dynos
heroku ps:scale web=2 -a smartqueue-api
heroku ps:scale web=2 -a smartqueue-reminders

# Scale worker dynos
heroku ps:scale worker=3 -a smartqueue-reminders
```

#### Docker
```yaml
# docker-compose.scale.yml
services:
  api:
    deploy:
      replicas: 3
  
  reminders:
    deploy:
      replicas: 2
  
  worker:
    deploy:
      replicas: 5
```

### Database Scaling

#### MongoDB
- Use MongoDB Atlas for managed database
- Configure read replicas
- Set up sharding for large datasets

#### PostgreSQL
- Use managed PostgreSQL service
- Configure read replicas
- Set up connection pooling

## 🚨 Backup Strategy

### Database Backups

#### MongoDB
```bash
# Backup
mongodump --uri="mongodb://localhost:27017/smartqueue" --out=backup/

# Restore
mongorestore --uri="mongodb://localhost:27017/smartqueue" backup/smartqueue/
```

#### PostgreSQL
```bash
# Backup
pg_dump -h localhost -U postgres reminder_db > backup.sql

# Restore
psql -h localhost -U postgres reminder_db < backup.sql
```

### Automated Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump --uri="$MONGODB_URL" --out="backups/mongo_$DATE"

# PostgreSQL backup
pg_dump $DATABASE_URL > "backups/postgres_$DATE.sql"

# Upload to cloud storage
aws s3 cp backups/ s3://your-backup-bucket/ --recursive
```

## 📞 Support

### Getting Help

1. **Check Logs**: Always check logs first
2. **Health Checks**: Use health check endpoints
3. **Documentation**: Refer to README.md files
4. **Community**: GitHub Issues for bugs
5. **Monitoring**: Set up alerts for critical failures

### Useful Commands

```bash
# Check service status
curl https://your-api.com/api/health/
curl https://your-reminder-service.com/api/health/

# Test email system
curl -X POST https://your-reminder-service.com/api/test-email/

# Get reminder statistics
curl https://your-reminder-service.com/api/stats/

# Check Celery tasks
celery -A reminder_service inspect active

# View logs
docker-compose logs -f reminders
```

This deployment guide should help you successfully deploy and maintain your SmartQueue reminder service in production!
