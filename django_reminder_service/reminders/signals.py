"""
Django signals for the reminders app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ReminderLog
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ReminderLog)
def log_reminder_creation(sender, instance, created, **kwargs):
    """Log when a new reminder is created"""
    if created:
        logger.info(f"New reminder log created for appointment {instance.appointment_id}")
    else:
        logger.info(f"Reminder log updated for appointment {instance.appointment_id}")
