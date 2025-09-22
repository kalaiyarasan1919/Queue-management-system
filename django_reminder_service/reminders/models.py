from django.db import models
from django.utils import timezone
from django.core.validators import EmailValidator


class ReminderLog(models.Model):
    """
    Model to track reminder emails sent to users
    """
    appointment_id = models.CharField(max_length=100, unique=True)
    user_email = models.EmailField(validators=[EmailValidator()])
    appointment_date = models.DateTimeField()
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    reminder_type = models.CharField(
        max_length=20,
        choices=[
            ('15min', '15 Minutes Before'),
            ('1hour', '1 Hour Before'),
            ('1day', '1 Day Before'),
        ],
        default='15min'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reminder_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['appointment_date', 'reminder_sent']),
            models.Index(fields=['user_email']),
            models.Index(fields=['appointment_id']),
        ]
    
    def __str__(self):
        return f"Reminder for {self.user_email} - {self.appointment_date}"


class EmailTemplate(models.Model):
    """
    Model to store email templates for different reminder types
    """
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=200)
    body_html = models.TextField()
    body_text = models.TextField()
    reminder_type = models.CharField(
        max_length=20,
        choices=[
            ('15min', '15 Minutes Before'),
            ('1hour', '1 Hour Before'),
            ('1day', '1 Day Before'),
        ]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_templates'
        unique_together = ['reminder_type', 'is_active']
    
    def __str__(self):
        return f"{self.name} - {self.reminder_type}"


class SystemSettings(models.Model):
    """
    Model to store system-wide settings
    """
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
    
    def __str__(self):
        return f"{self.key}: {self.value}"
