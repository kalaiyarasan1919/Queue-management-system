# SmartQueue Reminder Service

A Django-based background task system that sends automated reminder emails to users before their booking slots. This service integrates with your existing SmartQueue MongoDB database and provides a robust email reminder system.

## Features

- **Automated Reminders**: Sends email reminders 15 minutes before appointments
- **MongoDB Integration**: Connects to your existing SmartQueue database
- **Celery Background Tasks**: Uses Celery for reliable background processing
- **Email Templates**: Customizable HTML and text email templates
- **Admin Interface**: Django admin for managing reminders and templates
- **REST API**: RESTful API for integration with your main application
- **Health Monitoring**: Health check endpoints for monitoring
- **Deployment Ready**: Configured for Railway, Heroku, and other platforms

## Architecture

### Why Celery?

I recommend **Celery** for this project because:

1. **Production Ready**: Battle-tested in production environments
2. **Scalable**: Can handle high volumes of tasks
3. **Reliable**: Built-in retry mechanisms and error handling
4. **Flexible**: Supports multiple brokers (Redis, RabbitMQ, etc.)
5. **Monitoring**: Excellent monitoring and debugging tools
6. **Deployment Friendly**: Works well with cloud platforms

### Alternative Comparison

| Feature | Celery | Django-crontab | APScheduler |
|---------|--------|----------------|-------------|
| Production Ready | ✅ | ⚠️ | ✅ |
| Scalability | ✅ | ❌ | ✅ |
| Error Handling | ✅ | ❌ | ✅ |
| Monitoring | ✅ | ❌ | ✅ |
| Cloud Deployment | ✅ | ❌ | ✅ |
| Learning Curve | Medium | Easy | Easy |

## Quick Start

### 1. Installation

```bash
cd django_reminder_service
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
cp env.example .env
# Edit .env with your settings
```

### 3. Database Setup

```bash
python manage.py migrate
python manage.py setup_reminder_service
```

### 4. Start Services

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery Worker
celery -A reminder_service worker --loglevel=info

# Terminal 3: Start Celery Beat
celery -A reminder_service beat --loglevel=info

# Terminal 4: Start Django
python manage.py runserver
```

## Configuration

### Environment Variables

```env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=reminder_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# MongoDB (Your existing SmartQueue database)
MONGODB_URL=mongodb://localhost:27017/
MONGODB_DB=smartqueue
MONGODB_COLLECTION=appointments

# Celery (Redis)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@smartqueue.com
```

### Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `EMAIL_HOST_PASSWORD`

## API Endpoints

### Health Check
```http
GET /api/health/
```

### Reminders
```http
GET /api/reminders/                    # List all reminders
GET /api/reminders/{appointment_id}/   # Get specific reminder
POST /api/reminders/send/{appointment_id}/  # Send manual reminder
```

### Email Templates
```http
GET /api/templates/                    # List templates
GET /api/templates/{id}/               # Get specific template
POST /api/templates/                   # Create template
PUT /api/templates/{id}/               # Update template
DELETE /api/templates/{id}/            # Delete template
```

### Statistics
```http
GET /api/stats/                        # Get reminder statistics
```

### Test Email
```http
POST /api/test-email/                  # Send test email
```

## Usage Examples

### 1. Check System Health

```bash
curl http://localhost:8000/api/health/
```

### 2. Send Manual Reminder

```bash
curl -X POST http://localhost:8000/api/reminders/send/APPOINTMENT_ID/
```

### 3. Get Reminder Statistics

```bash
curl http://localhost:8000/api/stats/
```

### 4. Send Test Email

```bash
curl -X POST http://localhost:8000/api/test-email/
```

## Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy - Railway will automatically detect the Django app

### Heroku Deployment

1. Install Heroku CLI
2. Create Heroku app:
   ```bash
   heroku create your-reminder-service
   ```
3. Add Redis addon:
   ```bash
   heroku addons:create heroku-redis:mini
   ```
4. Set environment variables:
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set MONGODB_URL=your-mongodb-url
   # ... set other variables
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py migrate
RUN python manage.py setup_reminder_service

CMD ["gunicorn", "reminder_service.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Monitoring

### Celery Monitoring

```bash
# Install Flower for web monitoring
pip install flower

# Start Flower
celery -A reminder_service flower
```

### Logs

```bash
# View logs
tail -f logs/reminder_service.log

# View Celery logs
celery -A reminder_service events
```

## Integration with Your Node.js App

### 1. Add Reminder Endpoint to Your Node.js App

```javascript
// In your Node.js routes
app.post('/api/appointments/:id/send-reminder', async (req, res) => {
  try {
    const response = await fetch('http://your-django-service/api/reminders/send/' + req.params.id + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});
```

### 2. Update Appointment Creation

```javascript
// When creating an appointment, ensure it has the required fields
const appointment = {
  _id: generateId(),
  citizenId: userId,
  departmentId: departmentId,
  serviceId: serviceId,
  appointmentDate: new Date(appointmentDate),
  notificationEmail: user.email,
  status: 'confirmed',
  reminderSent: false, // Important for reminder system
  // ... other fields
};
```

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis is running: `redis-server`
   - Check Redis URL in settings

2. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check MongoDB URL and database name

3. **Email Not Sending**
   - Verify Gmail app password
   - Check SMTP settings
   - Test with `/api/test-email/` endpoint

4. **Celery Tasks Not Running**
   - Ensure Celery worker is running
   - Check Celery Beat is running for scheduled tasks
   - Verify Redis connection

### Debug Commands

```bash
# Check Celery status
celery -A reminder_service inspect active

# Check scheduled tasks
celery -A reminder_service inspect scheduled

# Check registered tasks
celery -A reminder_service inspect registered

# Test task execution
python manage.py shell
>>> from reminders.tasks import test_email_system
>>> test_email_system.delay()
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database Access**: Use read-only MongoDB user if possible
3. **Email Security**: Use app passwords, not account passwords
4. **Network Security**: Use HTTPS in production
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Performance Optimization

1. **Database Indexing**: Ensure proper indexes on MongoDB collections
2. **Celery Optimization**: Tune worker processes based on server capacity
3. **Email Batching**: Consider batching emails for high volume
4. **Caching**: Implement Redis caching for frequently accessed data

## Support

For issues and questions:
1. Check the logs in `logs/reminder_service.log`
2. Use the health check endpoint to verify system status
3. Test individual components using the API endpoints
4. Check Celery monitoring for task status

This service is designed to work seamlessly with your existing SmartQueue application while providing robust, scalable reminder functionality.
