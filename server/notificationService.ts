import { emailService } from './emailService';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'whatsapp';
  enabled: boolean;
  config?: any;
}

export interface NotificationData {
  to: string;
  channel: 'email' | 'sms' | 'whatsapp';
  template: string;
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'confirmation' | 'reminder' | 'called' | 'feedback' | 'cancellation' | 'waitlist';
  channel: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  htmlBody?: string;
  variables: string[];
  isActive: boolean;
}

export class NotificationService {
  private static channels: Record<string, NotificationChannel> = {
    email: { type: 'email', enabled: true },
    sms: { type: 'sms', enabled: false }, // Disabled by default
    whatsapp: { type: 'whatsapp', enabled: false } // Disabled by default
  };

  /**
   * Send notification through preferred channel
   */
  static async sendNotification(data: NotificationData): Promise<boolean> {
    const channel = this.channels[data.channel];
    
    if (!channel || !channel.enabled) {
      console.warn(`Channel ${data.channel} is not enabled`);
      return false;
    }

    try {
      switch (data.channel) {
        case 'email':
          return await this.sendEmailNotification(data);
        case 'sms':
          return await this.sendSmsNotification(data);
        case 'whatsapp':
          return await this.sendWhatsAppNotification(data);
        default:
          throw new Error(`Unsupported channel: ${data.channel}`);
      }
    } catch (error) {
      console.error(`Failed to send ${data.channel} notification:`, error);
      return false;
    }
  }

  /**
   * Send multiple notifications in batch
   */
  static async sendBatchNotifications(notifications: NotificationData[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{ data: NotificationData; success: boolean; error?: string }>;
  }> {
    const results = await Promise.allSettled(
      notifications.map(async (notification) => {
        try {
          const success = await this.sendNotification(notification);
          return { data: notification, success, error: success ? undefined : 'Failed to send' };
        } catch (error) {
          return { data: notification, success: false, error: error.message };
        }
      })
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          data: notifications[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    const successful = processedResults.filter(r => r.success).length;
    const failed = processedResults.length - successful;

    return { successful, failed, results: processedResults };
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(data: NotificationData): Promise<boolean> {
    const template = this.getTemplate(data.template, 'email');
    if (!template) {
      throw new Error(`Email template not found: ${data.template}`);
    }

    const subject = this.processTemplate(template.subject || '', data.variables);
    const htmlBody = this.processTemplate(template.htmlBody || template.body, data.variables);
    const textBody = this.processTemplate(template.body, data.variables);

    return await emailService.sendEmail(data.to, subject, htmlBody, textBody);
  }

  /**
   * Send SMS notification (simulation)
   */
  private static async sendSmsNotification(data: NotificationData): Promise<boolean> {
    const template = this.getTemplate(data.template, 'sms');
    if (!template) {
      throw new Error(`SMS template not found: ${data.template}`);
    }

    const message = this.processTemplate(template.body, data.variables);
    
    // Simulate SMS sending
    console.log(`📱 SMS to ${data.to}: ${message}`);
    
    // In production, integrate with Twilio or similar service
    // return await this.sendViaTwilio(data.to, message);
    
    return true; // Simulation always succeeds
  }

  /**
   * Send WhatsApp notification (simulation)
   */
  private static async sendWhatsAppNotification(data: NotificationData): Promise<boolean> {
    const template = this.getTemplate(data.template, 'whatsapp');
    if (!template) {
      throw new Error(`WhatsApp template not found: ${data.template}`);
    }

    const message = this.processTemplate(template.body, data.variables);
    
    // Simulate WhatsApp sending
    console.log(`💬 WhatsApp to ${data.to}: ${message}`);
    
    // In production, integrate with WhatsApp Business API
    // return await this.sendViaWhatsApp(data.to, message);
    
    return true; // Simulation always succeeds
  }

  /**
   * Get notification template
   */
  private static getTemplate(templateName: string, channel: string): NotificationTemplate | null {
    // In production, this would fetch from database
    const templates: Record<string, NotificationTemplate> = {
      'appointment_confirmation_email': {
        id: '1',
        name: 'Appointment Confirmation Email',
        type: 'confirmation',
        channel: 'email',
        subject: '✅ Booking Confirmed - Token {tokenNumber}',
        body: 'Dear {firstName},\n\nYour appointment has been confirmed!\n\nToken: {tokenNumber}\nDate: {appointmentDate}\nTime: {timeSlot}\nDepartment: {departmentName}\n\nPlease arrive 10 minutes before your scheduled time.\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>Booking Confirmed</h2><p>Dear {firstName},</p><p>Your appointment has been confirmed!</p><ul><li>Token: {tokenNumber}</li><li>Date: {appointmentDate}</li><li>Time: {timeSlot}</li><li>Department: {departmentName}</li></ul><p>Please arrive 10 minutes before your scheduled time.</p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'tokenNumber', 'appointmentDate', 'timeSlot', 'departmentName'],
        isActive: true
      },
      'appointment_reminder_email': {
        id: '2',
        name: 'Appointment Reminder Email',
        type: 'reminder',
        channel: 'email',
        subject: '⏰ Reminder: Your turn is coming in {minutesUntil} minutes - Token {tokenNumber}',
        body: 'Dear {firstName},\n\nYour turn is coming in {minutesUntil} minutes!\n\nToken: {tokenNumber}\nDepartment: {departmentName}\n\nPlease make your way to the office now.\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>Turn Reminder</h2><p>Dear {firstName},</p><p>Your turn is coming in {minutesUntil} minutes!</p><ul><li>Token: {tokenNumber}</li><li>Department: {departmentName}</li></ul><p>Please make your way to the office now.</p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'tokenNumber', 'minutesUntil', 'departmentName'],
        isActive: true
      },
      'appointment_called_email': {
        id: '3',
        name: 'Appointment Called Email',
        type: 'called',
        channel: 'email',
        subject: '🚨 Now Serving - Token {tokenNumber}',
        body: 'Dear {firstName},\n\nYour token {tokenNumber} is now being served!\n\nPlease proceed to counter {counterNumber}.\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>Now Serving</h2><p>Dear {firstName},</p><p>Your token {tokenNumber} is now being served!</p><p>Please proceed to counter {counterNumber}.</p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'tokenNumber', 'counterNumber'],
        isActive: true
      },
      'appointment_cancellation_email': {
        id: '4',
        name: 'Appointment Cancellation Email',
        type: 'cancellation',
        channel: 'email',
        subject: '❌ Appointment Cancelled - Token {tokenNumber}',
        body: 'Dear {firstName},\n\nYour appointment for token {tokenNumber} has been cancelled.\n\nReason: {cancellationReason}\n\nYou can book a new appointment anytime.\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>Appointment Cancelled</h2><p>Dear {firstName},</p><p>Your appointment for token {tokenNumber} has been cancelled.</p><p>Reason: {cancellationReason}</p><p>You can book a new appointment anytime.</p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'tokenNumber', 'cancellationReason'],
        isActive: true
      },
      'waitlist_confirmation_email': {
        id: '5',
        name: 'Waitlist Confirmation Email',
        type: 'waitlist',
        channel: 'email',
        subject: '📋 Waitlist Confirmed - Position {position}',
        body: 'Dear {firstName},\n\nYou have been added to the waitlist for {departmentName} on {preferredDate}.\n\nYour position: {position}\n\nWe will notify you if a slot becomes available.\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>Waitlist Confirmed</h2><p>Dear {firstName},</p><p>You have been added to the waitlist for {departmentName} on {preferredDate}.</p><p>Your position: {position}</p><p>We will notify you if a slot becomes available.</p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'departmentName', 'preferredDate', 'position'],
        isActive: true
      },
      'waitlist_assignment_email': {
        id: '6',
        name: 'Waitlist Assignment Email',
        type: 'waitlist',
        channel: 'email',
        subject: '🎉 Slot Available - Token {tokenNumber}',
        body: 'Dear {firstName},\n\nGreat news! A slot has become available and you have been assigned token {tokenNumber}.\n\nDate: {appointmentDate}\nTime: {timeSlot}\nDepartment: {departmentName}\n\nPlease arrive 10 minutes before your scheduled time.\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>Slot Available!</h2><p>Dear {firstName},</p><p>Great news! A slot has become available and you have been assigned token {tokenNumber}.</p><ul><li>Date: {appointmentDate}</li><li>Time: {timeSlot}</li><li>Department: {departmentName}</li></ul><p>Please arrive 10 minutes before your scheduled time.</p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'tokenNumber', 'appointmentDate', 'timeSlot', 'departmentName'],
        isActive: true
      },
      'feedback_request_email': {
        id: '7',
        name: 'Feedback Request Email',
        type: 'feedback',
        channel: 'email',
        subject: '📝 How was your experience? - Token {tokenNumber}',
        body: 'Dear {firstName},\n\nThank you for using our services!\n\nWe would love to hear about your experience with token {tokenNumber}.\n\nPlease take a moment to share your feedback: {feedbackLink}\n\nBest regards,\neQueue Team',
        htmlBody: '<h2>How was your experience?</h2><p>Dear {firstName},</p><p>Thank you for using our services!</p><p>We would love to hear about your experience with token {tokenNumber}.</p><p>Please take a moment to share your feedback: <a href="{feedbackLink}">Click here</a></p><p>Best regards,<br>eQueue Team</p>',
        variables: ['firstName', 'tokenNumber', 'feedbackLink'],
        isActive: true
      },
      'appointment_reminder_sms': {
        id: '8',
        name: 'Appointment Reminder SMS',
        type: 'reminder',
        channel: 'sms',
        body: 'eQueue: Your turn is coming in {minutesUntil} minutes! Token: {tokenNumber} at {timeSlot}. Reply STOP to opt out.',
        variables: ['minutesUntil', 'tokenNumber', 'timeSlot'],
        isActive: true
      },
      'appointment_called_sms': {
        id: '9',
        name: 'Appointment Called SMS',
        type: 'called',
        channel: 'sms',
        body: 'eQueue: Now serving Token {tokenNumber}! Please proceed to counter {counterNumber}. Reply STOP to opt out.',
        variables: ['tokenNumber', 'counterNumber'],
        isActive: true
      }
    };

    const key = `${templateName}_${channel}`;
    return templates[key] || null;
  }

  /**
   * Process template with variables
   */
  private static processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }
    
    return processed;
  }

  /**
   * Enable/disable notification channels
   */
  static configureChannel(channel: string, enabled: boolean, config?: any): void {
    if (this.channels[channel]) {
      this.channels[channel].enabled = enabled;
      if (config) {
        this.channels[channel].config = config;
      }
    }
  }

  /**
   * Get channel status
   */
  static getChannelStatus(): Record<string, NotificationChannel> {
    return { ...this.channels };
  }

  /**
   * Send appointment confirmation
   */
  static async sendAppointmentConfirmation(
    user: any,
    appointment: any,
    department: any,
    service: any,
    preferredChannel: string = 'email'
  ): Promise<boolean> {
    const variables = {
      firstName: user.firstName,
      tokenNumber: appointment.tokenNumber,
      appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString(),
      timeSlot: appointment.timeSlot,
      departmentName: department.name,
      serviceName: service.name
    };

    return await this.sendNotification({
      to: appointment.notificationEmail,
      channel: preferredChannel as any,
      template: 'appointment_confirmation',
      variables
    });
  }

  /**
   * Send appointment reminder
   */
  static async sendAppointmentReminder(
    user: any,
    appointment: any,
    department: any,
    minutesUntil: number,
    preferredChannel: string = 'email'
  ): Promise<boolean> {
    const variables = {
      firstName: user.firstName,
      tokenNumber: appointment.tokenNumber,
      minutesUntil,
      departmentName: department.name,
      timeSlot: appointment.timeSlot
    };

    return await this.sendNotification({
      to: appointment.notificationEmail,
      channel: preferredChannel as any,
      template: 'appointment_reminder',
      variables
    });
  }

  /**
   * Send appointment called notification
   */
  static async sendAppointmentCalled(
    user: any,
    appointment: any,
    counterNumber: string,
    preferredChannel: string = 'email'
  ): Promise<boolean> {
    const variables = {
      firstName: user.firstName,
      tokenNumber: appointment.tokenNumber,
      counterNumber
    };

    return await this.sendNotification({
      to: appointment.notificationEmail,
      channel: preferredChannel as any,
      template: 'appointment_called',
      variables
    });
  }
}

export const notificationService = new NotificationService();
