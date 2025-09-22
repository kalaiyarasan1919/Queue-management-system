# 🎯 SmartQueue Reminder Service Integration

## 🚀 **What We Built**

A complete **Django-based reminder service** that integrates with your existing **Node.js SmartQueue application** to send automated email reminders 15 minutes before appointment slots.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Node.js API    │    │ Django Reminder │
│   (Port 3000)   │◄──►│   (Port 5000)    │◄──►│   Service       │
│                 │    │                  │    │   (Port 8000)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MongoDB       │    │   Redis         │
                       │   Database      │    │   (Celery)      │
                       └─────────────────┘    └─────────────────┘
```

## 📁 **File Structure**

```
SmartQueue/
├── client/                          # React Frontend
├── server/                          # Node.js Backend
│   ├── routes.ts                    # ✅ Updated with reminder integration
│   └── reminderIntegration.js       # ✅ New integration module
├── django_reminder_service/         # ✅ New Django Service
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                         # ✅ Environment configuration
│   ├── reminder_service/
│   │   ├── settings.py              # ✅ Django settings
│   │   ├── celery.py                # ✅ Celery configuration
│   │   └── urls.py                  # ✅ API endpoints
│   └── reminders/
│       ├── models.py                # ✅ Database models
│       ├── views.py                 # ✅ API views
│       ├── tasks.py                 # ✅ Celery background tasks
│       ├── mongodb_client.py        # ✅ MongoDB integration
│       └── serializers.py           # ✅ Data serialization
└── test_integration.js              # ✅ Integration test script
```

## 🔧 **Key Features**

### ✅ **Automated Reminder System**
- **15-minute advance reminders** before appointment slots
- **Celery background tasks** for reliable scheduling
- **MongoDB integration** to read appointment data
- **Email templates** with customizable content
- **Duplicate prevention** (reminder_sent flag)

### ✅ **API Integration**
- **Health checks** for both services
- **Manual reminder triggers** for testing
- **Statistics and monitoring** endpoints
- **Test email functionality**

### ✅ **Production Ready**
- **Docker support** for easy deployment
- **Railway/Heroku** deployment configurations
- **Environment-based configuration**
- **Error handling and logging**

## 🚀 **How to Run**

### **Step 1: Start Django Reminder Service**
```bash
cd SmartQueue/django_reminder_service
python manage.py migrate
python manage.py setup_reminder_service
python manage.py runserver 8000
```

### **Step 2: Start Node.js Application**
```bash
cd SmartQueue
npm run dev
```

### **Step 3: Test Integration**
```bash
node test_integration.js
```

## 🔗 **API Endpoints**

### **Django Reminder Service (Port 8000)**
- `GET /api/health/` - Service health check
- `GET /api/stats/` - Reminder statistics
- `POST /api/test-email/` - Send test email
- `POST /api/reminders/send/{id}/` - Send specific reminder
- `POST /api/reminders/create/` - Create reminder log

### **Node.js Integration (Port 5000)**
- `GET /api/reminder-service/health` - Proxy to Django health
- `GET /api/reminder-service/stats` - Proxy to Django stats
- `POST /api/reminder-service/test-email` - Proxy to Django test email
- `POST /api/appointments/{id}/send-reminder` - Send reminder for appointment

## 📧 **Email Configuration**

### **Gmail SMTP Setup**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Update `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

## 🔄 **How It Works**

### **1. Appointment Creation**
When a citizen books an appointment:
1. **Node.js** creates appointment in MongoDB
2. **Django service** automatically detects new appointments
3. **Celery task** schedules reminder for 15 minutes before slot

### **2. Reminder Process**
Every minute, Celery runs:
1. **Check MongoDB** for appointments within 15-minute window
2. **Verify** reminder hasn't been sent already
3. **Send email** using configured SMTP
4. **Mark** appointment as `reminder_sent=True`

### **3. Email Content**
Reminders include:
- Citizen name and appointment details
- Department and service information
- Appointment time and date
- Appointment ID for reference

## 🐳 **Docker Deployment**

### **Docker Compose (Local)**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - REMINDER_SERVICE_URL=http://reminder:8000
  
  reminder:
    build: ./django_reminder_service
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017/
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
```

## 🚀 **Production Deployment**

### **Railway Deployment**
1. **Node.js App**: Deploy to Railway with environment variables
2. **Django Service**: Deploy separately with Redis addon
3. **MongoDB**: Use Railway MongoDB addon
4. **Environment Variables**: Set `REMINDER_SERVICE_URL`

### **Heroku Deployment**
1. **Node.js App**: Deploy with Heroku Postgres
2. **Django Service**: Deploy with Redis addon
3. **MongoDB**: Use MongoDB Atlas
4. **Scheduler**: Use Heroku Scheduler for Celery Beat

## 🔍 **Monitoring & Debugging**

### **Check Service Health**
```bash
# Django Service
curl http://localhost:8000/api/health/

# Node.js Integration
curl http://localhost:5000/api/reminder-service/health
```

### **View Reminder Stats**
```bash
curl http://localhost:5000/api/reminder-service/stats
```

### **Test Email System**
```bash
curl -X POST http://localhost:5000/api/reminder-service/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🎯 **Next Steps**

1. **Configure Email Settings** in `.env`
2. **Test the Integration** using `test_integration.js`
3. **Deploy to Production** using Docker or cloud platforms
4. **Monitor Performance** using the health check endpoints
5. **Customize Email Templates** in Django admin

## 🛠️ **Troubleshooting**

### **Common Issues**
- **Django service not starting**: Check Python dependencies
- **MongoDB connection failed**: Verify MongoDB is running
- **Email not sending**: Check SMTP credentials and app password
- **Celery tasks not running**: Ensure Redis is running

### **Logs Location**
- **Django**: `django_reminder_service/logs/reminder_service.log`
- **Node.js**: Console output
- **Celery**: `celery -A reminder_service worker --loglevel=info`

---

## 🎉 **Success!**

Your SmartQueue application now has a **robust, production-ready reminder system** that will automatically send email reminders to citizens 15 minutes before their appointment slots. The system is scalable, reliable, and ready for deployment!
