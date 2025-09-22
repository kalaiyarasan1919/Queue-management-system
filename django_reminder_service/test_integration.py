#!/usr/bin/env python3
"""
Integration test script for SmartQueue Reminder Service
"""
import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reminder_service.settings')
django.setup()

from reminders.models import ReminderLog, EmailTemplate
from reminders.mongodb_client import mongodb_client
from reminders.tasks import test_email_system, check_and_send_reminders

def test_mongodb_connection():
    """Test MongoDB connection"""
    print("🔄 Testing MongoDB connection...")
    try:
        appointments = mongodb_client.get_appointments_for_reminder()
        print(f"✅ MongoDB connected. Found {len(appointments)} appointments")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def test_database_connection():
    """Test PostgreSQL connection"""
    print("🔄 Testing PostgreSQL connection...")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        print("✅ PostgreSQL connected")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def test_redis_connection():
    """Test Redis connection"""
    print("🔄 Testing Redis connection...")
    try:
        from celery import current_app
        inspect = current_app.control.inspect()
        stats = inspect.stats()
        if stats:
            print("✅ Redis connected")
            return True
        else:
            print("❌ Redis connection failed: No workers found")
            return False
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False

def test_email_configuration():
    """Test email configuration"""
    print("🔄 Testing email configuration...")
    try:
        from django.conf import settings
        from django.core.mail import get_connection
        
        connection = get_connection()
        connection.open()
        connection.close()
        print("✅ Email configuration valid")
        return True
    except Exception as e:
        print(f"❌ Email configuration failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    print("🔄 Testing API endpoints...")
    base_url = "http://localhost:8000/api"
    
    endpoints = [
        ("/health/", "GET"),
        ("/stats/", "GET"),
        ("/reminders/", "GET"),
        ("/templates/", "GET"),
    ]
    
    success_count = 0
    for endpoint, method in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, timeout=5)
            
            if response.status_code == 200:
                print(f"✅ {method} {endpoint} - OK")
                success_count += 1
            else:
                print(f"❌ {method} {endpoint} - {response.status_code}")
        except Exception as e:
            print(f"❌ {method} {endpoint} - {e}")
    
    print(f"✅ {success_count}/{len(endpoints)} API endpoints working")
    return success_count == len(endpoints)

def test_celery_tasks():
    """Test Celery tasks"""
    print("🔄 Testing Celery tasks...")
    try:
        # Test email system task
        result = test_email_system.delay()
        print(f"✅ Test email task queued: {result.id}")
        
        # Test reminder check task
        result2 = check_and_send_reminders.delay()
        print(f"✅ Reminder check task queued: {result2.id}")
        
        return True
    except Exception as e:
        print(f"❌ Celery tasks failed: {e}")
        return False

def test_models():
    """Test Django models"""
    print("🔄 Testing Django models...")
    try:
        # Test ReminderLog model
        reminder_count = ReminderLog.objects.count()
        print(f"✅ ReminderLog model: {reminder_count} records")
        
        # Test EmailTemplate model
        template_count = EmailTemplate.objects.count()
        print(f"✅ EmailTemplate model: {template_count} templates")
        
        return True
    except Exception as e:
        print(f"❌ Django models failed: {e}")
        return False

def create_test_data():
    """Create test data for testing"""
    print("🔄 Creating test data...")
    try:
        # Create a test reminder log
        test_appointment_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        reminder, created = ReminderLog.objects.get_or_create(
            appointment_id=test_appointment_id,
            defaults={
                'user_email': 'test@example.com',
                'appointment_date': datetime.now() + timedelta(minutes=20),
                'reminder_type': '15min'
            }
        )
        
        if created:
            print(f"✅ Test reminder created: {test_appointment_id}")
        else:
            print(f"✅ Test reminder already exists: {test_appointment_id}")
        
        return True
    except Exception as e:
        print(f"❌ Test data creation failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting SmartQueue Reminder Service Integration Tests\n")
    
    tests = [
        ("MongoDB Connection", test_mongodb_connection),
        ("PostgreSQL Connection", test_database_connection),
        ("Redis Connection", test_redis_connection),
        ("Email Configuration", test_email_configuration),
        ("Django Models", test_models),
        ("API Endpoints", test_api_endpoints),
        ("Celery Tasks", test_celery_tasks),
        ("Test Data Creation", create_test_data),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Testing: {test_name}")
        print('='*50)
        
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print(f"\n{'='*50}")
    print(f"Test Results: {passed}/{total} tests passed")
    print('='*50)
    
    if passed == total:
        print("🎉 All tests passed! Your reminder service is ready to use.")
        print("\n📋 Next steps:")
        print("1. Start the services:")
        print("   - Redis: redis-server")
        print("   - Celery Worker: celery -A reminder_service worker --loglevel=info")
        print("   - Celery Beat: celery -A reminder_service beat --loglevel=info")
        print("   - Django: python manage.py runserver")
        print("2. Test the API: curl http://localhost:8000/api/health/")
        print("3. Send test email: curl -X POST http://localhost:8000/api/test-email/")
    else:
        print("❌ Some tests failed. Please check the errors above and fix them.")
        sys.exit(1)

if __name__ == "__main__":
    main()
