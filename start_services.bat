@echo off
echo 🚀 Starting SmartQueue with Reminder Service Integration
echo.

echo 📦 Starting Django Reminder Service...
start "Django Reminder Service" cmd /k "cd django_reminder_service && python manage.py runserver 8000"

echo ⏳ Waiting for Django service to start...
timeout /t 5 /nobreak > nul

echo 🌐 Starting Node.js Application...
start "Node.js SmartQueue" cmd /k "npm run dev"

echo.
echo ✅ Both services are starting up!
echo.
echo 📊 Service URLs:
echo    - Node.js App: http://localhost:5000
echo    - Django API:  http://localhost:8000
echo    - Health Check: http://localhost:5000/api/reminder-service/health
echo.
echo 🧪 Run integration test: node test_integration.js
echo.
pause
