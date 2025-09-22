from django.contrib import admin
from .models import ReminderLog, EmailTemplate, SystemSettings


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ['appointment_id', 'user_email', 'appointment_date', 'reminder_sent', 'reminder_sent_at', 'created_at']
    list_filter = ['reminder_sent', 'reminder_type', 'created_at']
    search_fields = ['appointment_id', 'user_email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Appointment Information', {
            'fields': ('appointment_id', 'user_email', 'appointment_date')
        }),
        ('Reminder Status', {
            'fields': ('reminder_sent', 'reminder_sent_at', 'reminder_type')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'reminder_type', 'is_active', 'created_at']
    list_filter = ['reminder_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['reminder_type', 'name']
    
    fieldsets = (
        ('Template Information', {
            'fields': ('name', 'reminder_type', 'is_active')
        }),
        ('Email Content', {
            'fields': ('subject', 'body_text', 'body_html')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_at']
    search_fields = ['key', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['key']
    
    fieldsets = (
        ('Setting Information', {
            'fields': ('key', 'value', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
