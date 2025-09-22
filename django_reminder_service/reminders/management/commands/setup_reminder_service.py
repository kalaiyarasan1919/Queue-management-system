"""
Django management command to set up the reminder service
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from reminders.models import EmailTemplate, SystemSettings
from reminders.tasks import create_default_email_template
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Set up the reminder service with default templates and settings'

    def handle(self, *args, **options):
        self.stdout.write('Setting up reminder service...')
        
        # Create default email template if it doesn't exist
        if not EmailTemplate.objects.filter(reminder_type='15min', is_active=True).exists():
            self.stdout.write('Creating default email template...')
            create_default_email_template()
            self.stdout.write(self.style.SUCCESS('Default email template created'))
        else:
            self.stdout.write('Default email template already exists')
        
        # Create default system settings
        default_settings = [
            ('REMINDER_ENABLED', 'true', 'Enable/disable reminder system'),
            ('REMINDER_MINUTES_BEFORE', '15', 'Minutes before appointment to send reminder'),
            ('EMAIL_FROM_NAME', 'SmartQueue', 'Name to use in email from field'),
            ('MAX_RETRY_ATTEMPTS', '3', 'Maximum retry attempts for failed emails'),
        ]
        
        for key, value, description in default_settings:
            setting, created = SystemSettings.objects.get_or_create(
                key=key,
                defaults={'value': value, 'description': description}
            )
            if created:
                self.stdout.write(f'Created setting: {key} = {value}')
            else:
                self.stdout.write(f'Setting already exists: {key} = {setting.value}')
        
        self.stdout.write(self.style.SUCCESS('Reminder service setup completed successfully!'))
