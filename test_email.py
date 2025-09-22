#!/usr/bin/env python3
"""
Test script to send an email to jdkalai4@gmail.com
This script tests the email functionality of the SmartQueue reminder system
"""

import os
import sys
import django
from pathlib import Path

# Add the Django project directory to Python path
django_project_path = Path(__file__).parent / "django_reminder_service"
sys.path.insert(0, str(django_project_path))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reminder_service.settings')

# Setup Django
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_email_system():
    """Test the email system by sending a test email"""
    
    # Test email configuration
    test_email = "jdkalai4@gmail.com"
    
    print("🧪 Testing Email System")
    print(f"📧 Sending test email to: {test_email}")
    print(f"📧 From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"📧 SMTP Host: {settings.EMAIL_HOST}")
    print(f"📧 SMTP Port: {settings.EMAIL_PORT}")
    print(f"📧 SMTP User: {settings.EMAIL_HOST_USER}")
    print("-" * 50)
    
    try:
        # Send test email
        result = send_mail(
            subject='🧪 SmartQueue Test Email - Reminder System',
            message='''
Hello!

This is a test email from the SmartQueue Reminder System.

If you are receiving this email, it means:
✅ The email system is working correctly
✅ The reminder service can send emails
✅ The SMTP configuration is properly set up

This test was initiated to verify that the reminder system can send emails to registered users for their token appointments.

Best regards,
SmartQueue Development Team
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            fail_silently=False,
        )
        
        if result:
            print("✅ Test email sent successfully!")
            print(f"📧 Email delivered to: {test_email}")
            return True
        else:
            print("❌ Failed to send test email")
            return False
            
    except Exception as e:
        print(f"❌ Error sending test email: {e}")
        logger.error(f"Email sending failed: {e}")
        return False

def test_reminder_email():
    """Test sending a reminder-style email"""
    
    test_email = "jdkalai4@gmail.com"
    
    print("\n🧪 Testing Reminder Email Template")
    print(f"📧 Sending reminder email to: {test_email}")
    print("-" * 50)
    
    try:
        # Create a reminder-style email
        subject = '⏰ Test Reminder: Your appointment is coming up - Token #TEST001'
        
        html_message = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
        .token { background: #b91c1c; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 8px; }
        .info { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
        .urgent { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Test Reminder</h1>
            <p>This is a test reminder email!</p>
        </div>
        
        <div class="content">
            <div class="token">
                Token Number: TEST001
            </div>
            
            <div class="urgent">
                <h3>🚨 This is a test reminder!</h3>
                <p>If you receive this email, the reminder system is working correctly.</p>
            </div>
            
            <div class="info">
                <h3>📋 Test Details</h3>
                <p><strong>Name:</strong> Test User</p>
                <p><strong>Service:</strong> Test Service</p>
                <p><strong>Department:</strong> Test Department</p>
                <p><strong>Date:</strong> Test Date</p>
                <p><strong>Time Slot:</strong> Test Time</p>
            </div>

            <div class="info">
                <h3>📍 What this test confirms:</h3>
                <ul>
                    <li>Email system is functional</li>
                    <li>Reminder templates work correctly</li>
                    <li>HTML formatting is preserved</li>
                    <li>SMTP configuration is correct</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
        '''
        
        text_message = '''
Test Reminder - Token TEST001

Dear Test User,

This is a test reminder email!

TEST DETAILS:
- Token Number: TEST001
- Service: Test Service
- Department: Test Department
- Date: Test Date
- Time Slot: Test Time

WHAT THIS TEST CONFIRMS:
- Email system is functional
- Reminder templates work correctly
- SMTP configuration is correct

This is a test email from SmartQueue Reminder System.
        '''
        
        result = send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        if result:
            print("✅ Test reminder email sent successfully!")
            print(f"📧 Reminder email delivered to: {test_email}")
            return True
        else:
            print("❌ Failed to send test reminder email")
            return False
            
    except Exception as e:
        print(f"❌ Error sending test reminder email: {e}")
        logger.error(f"Reminder email sending failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting SmartQueue Email Test")
    print("=" * 60)
    
    # Test basic email
    basic_success = test_email_system()
    
    # Test reminder email
    reminder_success = test_reminder_email()
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"Basic Email: {'✅ PASS' if basic_success else '❌ FAIL'}")
    print(f"Reminder Email: {'✅ PASS' if reminder_success else '❌ FAIL'}")
    
    if basic_success and reminder_success:
        print("\n🎉 All email tests passed! The reminder system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
    
    print("=" * 60)
