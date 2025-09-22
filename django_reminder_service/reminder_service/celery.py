import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reminder_service.settings')

app = Celery('reminder_service')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    'check-reminders-every-minute': {
        'task': 'reminders.tasks.check_and_send_reminders',
        'schedule': 60.0,  # Run every minute
    },
    'cleanup-old-reminders': {
        'task': 'reminders.tasks.cleanup_old_reminders',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2 AM
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
