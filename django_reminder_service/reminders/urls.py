from django.urls import path
from . import views

urlpatterns = [
    path('reminders/', views.ReminderListView.as_view(), name='reminder-list'),
    path('reminders/<str:appointment_id>/', views.ReminderDetailView.as_view(), name='reminder-detail'),
    path('reminders/send/<str:appointment_id>/', views.SendReminderView.as_view(), name='send-reminder'),
    path('templates/', views.EmailTemplateListView.as_view(), name='template-list'),
    path('templates/<int:template_id>/', views.EmailTemplateDetailView.as_view(), name='template-detail'),
    path('test-email/', views.TestEmailView.as_view(), name='test-email'),
    path('stats/', views.ReminderStatsView.as_view(), name='reminder-stats'),
]
