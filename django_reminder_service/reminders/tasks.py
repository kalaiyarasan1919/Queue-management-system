"""
Celery tasks for sending reminder emails
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import ReminderLog, EmailTemplate, SystemSettings
from .mongodb_client import mongodb_client

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def check_and_send_reminders(self):
    """
    Check for appointments that need reminder emails and send them
    This task runs every minute via Celery Beat
    """
    try:
        logger.info("Starting reminder check task")
        
        # Get appointments that need 15-minute reminders
        appointments = mongodb_client.get_appointments_for_reminder(minutes_before=15)
        
        if not appointments:
            logger.info("No appointments found for reminder")
            return {"status": "success", "reminders_sent": 0}
        
        reminders_sent = 0
        for appointment in appointments:
            try:
                # Send reminder email
                success = send_reminder_email.delay(
                    appointment_id=appointment['_id'],
                    user_email=appointment.get('notificationEmail', ''),
                    appointment_date=appointment['appointmentDate'],
                    appointment_data=appointment
                )
                
                if success:
                    reminders_sent += 1
                    logger.info(f"Reminder queued for appointment {appointment['_id']}")
                
            except Exception as e:
                logger.error(f"Error processing appointment {appointment['_id']}: {e}")
                continue
        
        logger.info(f"Reminder check completed. {reminders_sent} reminders queued")
        return {"status": "success", "reminders_sent": reminders_sent}
        
    except Exception as e:
        logger.error(f"Error in reminder check task: {e}")
        return {"status": "error", "message": str(e)}


@shared_task(bind=True)
def send_reminder_email(self, appointment_id: str, user_email: str, 
                       appointment_date: datetime, appointment_data: Dict):
    """
    Send a reminder email for a specific appointment
    
    Args:
        appointment_id: The appointment ID
        user_email: User's email address
        appointment_date: Appointment date and time
        appointment_data: Full appointment data from MongoDB
    """
    try:
        logger.info(f"Sending reminder email for appointment {appointment_id}")
        
        # Check if reminder already sent
        reminder_log, created = ReminderLog.objects.get_or_create(
            appointment_id=appointment_id,
            defaults={
                'user_email': user_email,
                'appointment_date': appointment_date,
                'reminder_type': '15min'
            }
        )
        
        if not created and reminder_log.reminder_sent:
            logger.info(f"Reminder already sent for appointment {appointment_id}")
            return True
        
        # Get user, department, and service information
        user = mongodb_client.get_user_by_id(appointment_data.get('citizenId'))
        department = mongodb_client.get_department_by_id(appointment_data.get('departmentId'))
        service = mongodb_client.get_service_by_id(appointment_data.get('serviceId'))
        
        # Prepare email context
        context = {
            'user': user,
            'appointment': appointment_data,
            'department': department,
            'service': service,
            'appointment_date': appointment_date,
            'appointment_time': appointment_date.strftime('%I:%M %p'),
            'appointment_date_formatted': appointment_date.strftime('%B %d, %Y'),
            'token_number': appointment_data.get('tokenNumber', 'N/A'),
            'queue_position': appointment_data.get('queuePosition', 'N/A'),
        }
        
        # Get email template
        template = EmailTemplate.objects.filter(
            reminder_type='15min',
            is_active=True
        ).first()
        
        if not template:
            # Create default template if none exists
            template = create_default_email_template()
        
        # Send email
        subject = template.subject.format(**context)
        message = template.body_text.format(**context)
        html_message = template.body_html.format(**context)
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        # Mark reminder as sent
        reminder_log.reminder_sent = True
        reminder_log.reminder_sent_at = datetime.now()
        reminder_log.save()
        
        # Mark in MongoDB
        mongodb_client.mark_reminder_sent(appointment_id)
        
        logger.info(f"Reminder email sent successfully for appointment {appointment_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending reminder email for {appointment_id}: {e}")
        return False


@shared_task(bind=True)
def send_custom_reminder(self, appointment_id: str, reminder_type: str = '15min'):
    """
    Send a custom reminder for a specific appointment
    
    Args:
        appointment_id: The appointment ID
        reminder_type: Type of reminder (15min, 1hour, 1day)
    """
    try:
        appointment = mongodb_client.get_appointment_by_id(appointment_id)
        if not appointment:
            logger.error(f"Appointment {appointment_id} not found")
            return False
        
        return send_reminder_email.delay(
            appointment_id=appointment_id,
            user_email=appointment.get('notificationEmail', ''),
            appointment_date=appointment['appointmentDate'],
            appointment_data=appointment
        )
        
    except Exception as e:
        logger.error(f"Error sending custom reminder for {appointment_id}: {e}")
        return False


@shared_task(bind=True)
def cleanup_old_reminders(self):
    """
    Clean up old reminder logs (older than 30 days)
    This task runs daily via Celery Beat
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=30)
        deleted_count = ReminderLog.objects.filter(
            created_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old reminder logs")
        return {"status": "success", "deleted_count": deleted_count}
        
    except Exception as e:
        logger.error(f"Error cleaning up old reminders: {e}")
        return {"status": "error", "message": str(e)}


@shared_task(bind=True)
def test_email_system(self):
    """
    Test task to verify email system is working
    """
    try:
        send_mail(
            subject='Test Email from SmartQueue Reminder Service',
            message='This is a test email to verify the email system is working correctly.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
            fail_silently=False,
        )
        
        logger.info("Test email sent successfully")
        return {"status": "success", "message": "Test email sent"}
        
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        return {"status": "error", "message": str(e)}


def create_default_email_template():
    """
    Create a default email template if none exists
    """
    template = EmailTemplate.objects.create(
        name="Default 15-Minute Reminder",
        subject="Reminder: Your appointment is in 15 minutes - {token_number}",
        body_text="""
Dear {user[firstName]} {user[lastName]},

This is a reminder that you have an appointment scheduled for {appointment_date_formatted} at {appointment_time}.

Appointment Details:
- Token Number: {token_number}
- Department: {department[name]}
- Service: {service[name]}
- Queue Position: {queue_position}

Please arrive at least 5 minutes before your scheduled time.

Thank you for using SmartQueue!

Best regards,
SmartQueue Team
        """,
        body_html="""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Appointment Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8fafc; }
        .appointment-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .highlight { color: #2563eb; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Reminder</h1>
        </div>
        <div class="content">
            <p>Dear {user[firstName]} {user[lastName]},</p>
            <p>This is a reminder that you have an appointment scheduled for <span class="highlight">{appointment_date_formatted} at {appointment_time}</span>.</p>
            
            <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <ul>
                    <li><strong>Token Number:</strong> {token_number}</li>
                    <li><strong>Department:</strong> {department[name]}</li>
                    <li><strong>Service:</strong> {service[name]}</li>
                    <li><strong>Queue Position:</strong> {queue_position}</li>
                </ul>
            </div>
            
            <p><strong>Please arrive at least 5 minutes before your scheduled time.</strong></p>
            <p>Thank you for using SmartQueue!</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>SmartQueue Team</p>
        </div>
    </div>
</body>
</html>
        """,
        reminder_type='15min',
        is_active=True
    )
    
    return template
