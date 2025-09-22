from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime
from .models import ReminderLog, EmailTemplate, SystemSettings
from .tasks import send_custom_reminder, test_email_system
from .serializers import ReminderLogSerializer, EmailTemplateSerializer
from .mongodb_client import mongodb_client
import logging

logger = logging.getLogger(__name__)


class ReminderListView(generics.ListAPIView):
    """List all reminder logs"""
    queryset = ReminderLog.objects.all()
    serializer_class = ReminderLogSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by reminder_sent status
        reminder_sent = self.request.query_params.get('reminder_sent')
        if reminder_sent is not None:
            queryset = queryset.filter(reminder_sent=reminder_sent.lower() == 'true')
        
        # Filter by reminder_type
        reminder_type = self.request.query_params.get('reminder_type')
        if reminder_type:
            queryset = queryset.filter(reminder_type=reminder_type)
        
        return queryset


class ReminderDetailView(generics.RetrieveAPIView):
    """Get details of a specific reminder log"""
    queryset = ReminderLog.objects.all()
    serializer_class = ReminderLogSerializer
    lookup_field = 'appointment_id'


class SendReminderView(generics.GenericAPIView):
    """Manually send a reminder for a specific appointment"""
    
    def post(self, request, appointment_id):
        try:
            # Check if appointment exists in MongoDB
            appointment = mongodb_client.get_appointment_by_id(appointment_id)
            if not appointment:
                return Response(
                    {'error': 'Appointment not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Queue the reminder task
            task = send_custom_reminder.delay(appointment_id)
            
            return Response({
                'message': 'Reminder queued successfully',
                'task_id': task.id,
                'appointment_id': appointment_id
            })
            
        except Exception as e:
            logger.error(f"Error sending reminder for {appointment_id}: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailTemplateListView(generics.ListCreateAPIView):
    """List and create email templates"""
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer


class EmailTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete email templates"""
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer


class TestEmailView(generics.GenericAPIView):
    """Test email system"""
    
    def post(self, request):
        try:
            # Queue the test email task
            task = test_email_system.delay()
            
            return Response({
                'message': 'Test email queued successfully',
                'task_id': task.id
            })
            
        except Exception as e:
            logger.error(f"Error sending test email: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReminderStatsView(generics.GenericAPIView):
    """Get reminder statistics"""
    
    def get(self, request):
        try:
            from django.db.models import Count
            from datetime import datetime, timedelta
            
            # Get basic stats
            total_reminders = ReminderLog.objects.count()
            sent_reminders = ReminderLog.objects.filter(reminder_sent=True).count()
            pending_reminders = ReminderLog.objects.filter(reminder_sent=False).count()
            
            # Get stats by type
            by_type = ReminderLog.objects.values('reminder_type').annotate(
                count=Count('id')
            ).order_by('reminder_type')
            
            # Get stats for last 24 hours
            last_24h = datetime.now() - timedelta(hours=24)
            recent_reminders = ReminderLog.objects.filter(
                created_at__gte=last_24h
            ).count()
            
            # Get upcoming appointments from MongoDB
            upcoming_appointments = mongodb_client.get_appointments_for_reminder(minutes_before=15)
            
            stats = {
                'total_reminders': total_reminders,
                'sent_reminders': sent_reminders,
                'pending_reminders': pending_reminders,
                'recent_reminders_24h': recent_reminders,
                'upcoming_appointments': len(upcoming_appointments),
                'by_type': list(by_type),
                'success_rate': (sent_reminders / total_reminders * 100) if total_reminders > 0 else 0
            }
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error getting reminder stats: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        appointments = mongodb_client.get_appointments_for_reminder(minutes_before=15)
        
        return JsonResponse({
            'status': 'healthy',
            'mongodb_connected': True,
            'upcoming_appointments': len(appointments),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=500)
