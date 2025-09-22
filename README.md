# 🏛️ SmartQueue - Digital Queue Management System for Government Offices

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-4.2+-green.svg)](https://djangoproject.com/)

A comprehensive **Digital Queue Management System** designed specifically for government offices, featuring multi-department support, real-time queue tracking, automated reminders, and advanced analytics. Built with modern web technologies and designed for scalability and citizen satisfaction.

## 🌟 Key Features

### 🏢 **Multi-Department Support**
- **Multiple Departments**: RTO, Revenue, Health, Municipal, and more
- **Department-Specific Services**: Customizable services per department
- **Capacity Management**: Configurable slots and capacity per department
- **Service Management**: Dynamic service creation and management

### 📱 **Smart Queue Management**
- **Real-time Queue Tracking**: Live queue status and position updates
- **QR Code & OTP Check-in**: Secure mobile check-in system
- **Waitlist & Auto-Reallocation**: Smart waitlist with automatic slot assignment
- **Priority System**: VIP, PwD, Senior Citizen, and Emergency priority handling

### 🔔 **Advanced Notification System**
- **Multi-Channel Notifications**: Email, SMS, and WhatsApp support
- **Automated Reminders**: 15-minute advance email reminders
- **Template System**: Configurable notification templates
- **Batch Processing**: Efficient notification delivery

### 📊 **Comprehensive Analytics**
- **Real-time Dashboard**: Live performance metrics and analytics
- **Detailed Reports**: Daily, monthly, and custom period reports
- **Citizen Feedback**: 5-star rating system with detailed feedback
- **Performance Tracking**: Department and clerk performance metrics

### 🔐 **Security & Authentication**
- **Multiple Auth Methods**: Google OAuth, Local Auth, and Replit Auth
- **Role-Based Access**: Citizen, Clerk, and Admin roles
- **Audit Logging**: Complete audit trail for all operations
- **Data Encryption**: Secure handling of sensitive data

## 🏗️ Architecture

### **Frontend (React + TypeScript)**
- **Modern UI**: Built with Radix UI components and Tailwind CSS
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Internationalization**: Multi-language support with i18next
- **Real-time Updates**: WebSocket integration for live updates

### **Backend (Node.js + Express)**
- **RESTful API**: Comprehensive API with proper error handling
- **Database Integration**: MongoDB with Drizzle ORM
- **Session Management**: Secure session handling with Express Session
- **File Upload**: Support for document uploads (PwD certificates)

### **Reminder Service (Django + Celery)**
- **Background Tasks**: Celery for reliable task scheduling
- **Email Integration**: SMTP support with HTML templates
- **MongoDB Integration**: Direct database access for appointments
- **Health Monitoring**: Comprehensive health checks and statistics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB
- Redis (for Celery)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/SmartQueue.git
cd SmartQueue
```

2. **Install dependencies**
```bash
# Main application
npm install

# Django reminder service
cd django_reminder_service
pip install -r requirements.txt
cd ..
```

3. **Set up environment variables**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

4. **Configure database**
```bash
# Run database migrations
npm run db:push
```

5. **Start services**
```bash
# Terminal 1: Start main application
npm run dev

# Terminal 2: Start Django reminder service
cd django_reminder_service
python manage.py migrate
python manage.py runserver 8000

# Terminal 3: Start Celery worker
celery -A reminder_service worker --loglevel=info
```

## 📋 Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smartqueue
MONGO_URL=mongodb://127.0.0.1:27017/smartqueue

# Session
SESSION_SECRET=your-super-secret-session-key-here

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=SmartQueue <noreply@smartqueue.local>

# Reminder Service
REMINDER_SERVICE_URL=http://localhost:8000

# System Configuration
FRONTEND_URL=http://localhost:5173
GRACE_PERIOD_MINUTES=15
REACTIVATION_WINDOW_HOURS=2
```

## 🎯 User Roles & Workflows

### 👤 **Citizen Workflow**
1. **Registration/Login** → Choose authentication method
2. **Department Selection** → Select from available departments
3. **Service Selection** → Choose specific service
4. **Date & Time** → Pick preferred slot
5. **Priority Declaration** → Declare PwD, senior, VIP, or emergency status
6. **Document Upload** → Upload supporting documents
7. **Confirmation** → Receive QR code/OTP
8. **Check-in** → Scan QR or enter OTP at office
9. **Service** → Receive service from clerk
10. **Feedback** → Submit feedback after service

### 👨‍💼 **Clerk Workflow**
1. **Login** → Access clerk dashboard
2. **Queue Management** → View and manage live queues
3. **Token Calling** → Call next token based on priority
4. **Service Delivery** → Mark tokens as serving/completed
5. **No-Show Handling** → Mark no-shows and process waitlist
6. **Queue Control** → Pause/resume queues as needed

### 👨‍💻 **Admin Workflow**
1. **Dashboard** → View comprehensive analytics
2. **Department Management** → Manage departments and services
3. **User Management** → Manage citizens and clerks
4. **Reports** → Generate and export reports
5. **System Configuration** → Configure policies and settings
6. **Audit Review** → Review system audit logs

## 🔧 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout

### **Appointment Endpoints**
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `POST /api/appointments/:id/send-reminder` - Send reminder

### **Queue Management**
- `GET /api/queue/live` - Get live queue status
- `POST /api/queue/call-next` - Call next token
- `POST /api/queue/mark-served` - Mark token as served
- `POST /api/queue/mark-no-show` - Mark as no-show

### **Admin Endpoints**
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/reports` - Generate reports
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/departments` - Manage departments

## 🐳 Docker Deployment

### **Docker Compose**
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

### **Run with Docker**
```bash
docker-compose up -d
```

## 📊 Monitoring & Analytics

### **Key Metrics**
- **Queue Performance**: Average wait time, service time, efficiency
- **Citizen Satisfaction**: Feedback ratings and comments
- **System Usage**: Appointment volumes, peak times
- **No-Show Rates**: Track and analyze no-show patterns
- **Department Performance**: Compare department efficiency

### **Available Reports**
- **Daily Operations Report**: Complete daily summary
- **Monthly Analytics**: Monthly performance analysis
- **Citizen Feedback Report**: Feedback analysis and trends
- **Audit Report**: System activity and changes
- **Department Performance**: Department-wise analytics

## 🛠️ Development

### **Tech Stack**
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB, PostgreSQL
- **Reminder Service**: Django, Celery, Redis
- **Authentication**: Passport.js, Google OAuth
- **Real-time**: WebSocket, Socket.io
- **Deployment**: Docker, Railway, Heroku

### **Scripts**
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:generate     # Generate migrations

# Testing
npm run test            # Run tests
npm run test:integration # Run integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed documentation
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🎯 Roadmap

### **Phase 1** ✅
- [x] Basic queue management
- [x] Multi-department support
- [x] Authentication system
- [x] Real-time updates

### **Phase 2** ✅
- [x] Advanced notification system
- [x] Reminder service integration
- [x] Analytics and reporting
- [x] Feedback system

### **Phase 3** 🚧
- [ ] Mobile application
- [ ] AI-powered optimization
- [ ] Blockchain audit trail
- [ ] IoT integration

### **Phase 4** 📋
- [ ] Microservices architecture
- [ ] Advanced caching
- [ ] CDN integration
- [ ] Machine learning analytics

## 🙏 Acknowledgments

- **Government Offices** for providing requirements and feedback
- **Open Source Community** for the amazing tools and libraries
- **Contributors** who help improve the system

---

**Built with ❤️ for better government services**

*SmartQueue - Transforming government office experiences through technology*