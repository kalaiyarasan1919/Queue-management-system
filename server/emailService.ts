import nodemailer from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    };

    if (smtpConfig.auth) {
      this.transporter = nodemailer.createTransport(smtpConfig);
      console.log('📧 Email service initialized with SMTP');
    } else {
      console.log('📧 Email service running in simulation mode (no SMTP configured)');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.transporter) {
      // Simulation mode
      console.log(`\n📧 EMAIL SIMULATION:`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || html.replace(/<[^>]*>/g, '')}`);
      console.log(`---\n`);
      return true;
    }

    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || 'SmartQueue <noreply@smartqueue.local>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      return false;
    }
  }

  generateBookingConfirmation(user: any, appointment: any, department: any, service: any): EmailTemplate {
    const tokenNumber = appointment.tokenNumber;
    const timeSlot = appointment.timeSlot;
    const date = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `✅ Booking Confirmed - Token ${tokenNumber}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .token { background: #1e40af; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 8px; }
          .info { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
          .pwd-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 eQueue - Smart Token Generator</h1>
            <p>Your appointment has been confirmed!</p>
          </div>
          
          <div class="content">
            <div class="token">
              Token Number: ${tokenNumber}
            </div>
            
            <div class="info">
              <h3>📋 Appointment Details</h3>
              <p><strong>Name:</strong> ${user.firstName} ${user.lastName || ''}</p>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Department:</strong> ${department.name}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time Slot:</strong> ${timeSlot}</p>
              <p><strong>Priority:</strong> ${appointment.isPwd ? '♿ PwD Priority' : appointment.priority}</p>
            </div>

            ${appointment.isPwd ? `
            <div class="pwd-notice">
              <h4>♿ Priority Service</h4>
              <p>You have been granted priority service due to your disability certificate. Please arrive 10 minutes before your scheduled time.</p>
            </div>
            ` : ''}

            <div class="info">
              <h3>📝 Important Instructions</h3>
              <ul>
                <li>Please arrive <strong>10 minutes before</strong> your scheduled time</li>
                <li>Bring a valid ID proof and required documents</li>
                <li>Show this email or your token number at the counter</li>
                <li>If you need to reschedule, please contact the office</li>
              </ul>
            </div>

            <div class="info">
              <h3>📍 Office Location</h3>
              <p>Please visit the ${department.name} office during working hours.</p>
              <p><strong>Working Hours:</strong> 9:00 AM - 5:00 PM (Monday to Friday)</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated message from eQueue Smart Token Generator</p>
            <p>For support, contact: support@smartqueue.local</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Booking Confirmation - Token ${tokenNumber}

Dear ${user.firstName},

Your appointment has been confirmed!

APPOINTMENT DETAILS:
- Token Number: ${tokenNumber}
- Service: ${service.name}
- Department: ${department.name}
- Date: ${date}
- Time Slot: ${timeSlot}
- Priority: ${appointment.isPwd ? 'PwD Priority' : appointment.priority}

IMPORTANT INSTRUCTIONS:
- Please arrive 10 minutes before your scheduled time
- Bring a valid ID proof and required documents
- Show this email or your token number at the counter
- If you need to reschedule, please contact the office

${appointment.isPwd ? 'PRIORITY SERVICE: You have been granted priority service due to your disability certificate.' : ''}

Office Location: ${department.name}
Working Hours: 9:00 AM - 5:00 PM (Monday to Friday)

This is an automated message from eQueue Smart Token Generator.
For support, contact: support@smartqueue.local
    `;

    return { subject, html, text };
  }

  generateReminderEmail(user: any, appointment: any, department: any, service: any, minutesUntil: number): EmailTemplate {
    const tokenNumber = appointment.tokenNumber;
    const timeSlot = appointment.timeSlot;
    const date = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `⏰ Reminder: Your turn is coming in ${minutesUntil} minutes - Token ${tokenNumber}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Turn Reminder</title>
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
            <h1>⏰ Turn Reminder</h1>
            <p>Your appointment is coming up soon!</p>
          </div>
          
          <div class="content">
            <div class="token">
              Token Number: ${tokenNumber}
            </div>
            
            <div class="urgent">
              <h3>🚨 Your turn is in ${minutesUntil} minutes!</h3>
              <p>Please make your way to the ${department.name} office now.</p>
            </div>
            
            <div class="info">
              <h3>📋 Appointment Details</h3>
              <p><strong>Name:</strong> ${user.firstName} ${user.lastName || ''}</p>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Department:</strong> ${department.name}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time Slot:</strong> ${timeSlot}</p>
            </div>

            <div class="info">
              <h3>📍 What to do now:</h3>
              <ul>
                <li>Go to the ${department.name} office immediately</li>
                <li>Look for your token number on the display board</li>
                <li>Wait for your turn to be called</li>
                <li>Have your documents ready</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Turn Reminder - Token ${tokenNumber}

Dear ${user.firstName},

Your turn is coming in ${minutesUntil} minutes!

APPOINTMENT DETAILS:
- Token Number: ${tokenNumber}
- Service: ${service.name}
- Department: ${department.name}
- Date: ${date}
- Time Slot: ${timeSlot}

WHAT TO DO NOW:
- Go to the ${department.name} office immediately
- Look for your token number on the display board
- Wait for your turn to be called
- Have your documents ready

This is an automated reminder from eQueue Smart Token Generator.
    `;

    return { subject, html, text };
  }

  generateSmsNotification(user: any, appointment: any, message: string): string {
    return `eQueue: ${message} Token: ${appointment.tokenNumber} at ${appointment.timeSlot}. Reply STOP to opt out.`;
  }
}

export const emailService = new EmailService();
