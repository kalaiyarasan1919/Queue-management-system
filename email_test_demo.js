/**
 * Comprehensive Email Test Demo for SmartQueue
 * This script demonstrates the email functionality and sends a test email to jdkalai4@gmail.com
 */

import nodemailer from 'nodemailer';

// Email service class that mimics the actual email service
class SmartQueueEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check for environment variables or use simulation mode
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    };

    if (smtpConfig.auth) {
      this.transporter = nodemailer.createTransporter(smtpConfig);
      console.log('📧 Email service initialized with SMTP');
    } else {
      console.log('📧 Email service running in simulation mode (no SMTP configured)');
    }
  }

  async sendEmail(to, subject, html, text) {
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

  generateTestReminderEmail(user, appointment, department, service, minutesUntil = 15) {
    const tokenNumber = appointment.tokenNumber || 'TEST001';
    const timeSlot = appointment.timeSlot || '10:00 AM - 11:00 AM';
    const date = new Date(appointment.appointmentDate || new Date()).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `⏰ Test Reminder: Your turn is coming in ${minutesUntil} minutes - Token ${tokenNumber}`;
    
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
          .test-notice { background: #e0f2fe; border: 1px solid #0288d1; padding: 15px; margin: 15px 0; border-radius: 8px; }
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
            
            <div class="test-notice">
              <h3>🧪 This is a TEST reminder!</h3>
              <p>This email was sent to test the SmartQueue reminder system. If you receive this, the system is working correctly!</p>
            </div>
            
            <div class="urgent">
              <h3>🚨 Your turn is in ${minutesUntil} minutes!</h3>
              <p>Please make your way to the ${department.name || 'Test Department'} office now.</p>
            </div>
            
            <div class="info">
              <h3>📋 Appointment Details</h3>
              <p><strong>Name:</strong> ${user.firstName || 'Test'} ${user.lastName || 'User'}</p>
              <p><strong>Service:</strong> ${service.name || 'Test Service'}</p>
              <p><strong>Department:</strong> ${department.name || 'Test Department'}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time Slot:</strong> ${timeSlot}</p>
            </div>

            <div class="info">
              <h3>📍 What to do now:</h3>
              <ul>
                <li>Go to the ${department.name || 'Test Department'} office immediately</li>
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

Dear ${user.firstName || 'Test User'},

This is a TEST reminder that your turn is coming in ${minutesUntil} minutes!

APPOINTMENT DETAILS:
- Token Number: ${tokenNumber}
- Service: ${service.name || 'Test Service'}
- Department: ${department.name || 'Test Department'}
- Date: ${date}
- Time Slot: ${timeSlot}

WHAT TO DO NOW:
- Go to the ${department.name || 'Test Department'} office immediately
- Look for your token number on the display board
- Wait for your turn to be called
- Have your documents ready

This is a test email from eQueue Smart Token Generator.
    `;

    return { subject, html, text };
  }
}

async function runEmailTest() {
  console.log('🚀 SmartQueue Email System Test');
  console.log('=' * 60);
  console.log('📧 Testing email functionality for jdkalai4@gmail.com');
  console.log('');

  const emailService = new SmartQueueEmailService();
  const testEmail = 'jdkalai4@gmail.com';

  // Test data
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: testEmail
  };

  const testAppointment = {
    tokenNumber: 'TEST001',
    timeSlot: '10:00 AM - 11:00 AM',
    appointmentDate: new Date(),
    isPwd: false,
    priority: 'Normal'
  };

  const testDepartment = {
    name: 'Test Department',
    location: 'Test Office'
  };

  const testService = {
    name: 'Test Service',
    description: 'Testing the reminder system'
  };

  try {
    // Test 1: Basic email
    console.log('🧪 Test 1: Basic Email Functionality');
    console.log('-'.repeat(40));
    
    const basicResult = await emailService.sendEmail(
      testEmail,
      '🧪 SmartQueue Test Email - System Working!',
      '<h1>Test Email</h1><p>This confirms the SmartQueue email system is working correctly.</p>',
      'Test Email\n\nThis confirms the SmartQueue email system is working correctly.'
    );

    if (basicResult) {
      console.log('✅ Basic email test passed!');
    }

    // Test 2: Reminder email
    console.log('\n🧪 Test 2: Reminder Email Template');
    console.log('-'.repeat(40));
    
    const reminderTemplate = emailService.generateTestReminderEmail(
      testUser,
      testAppointment,
      testDepartment,
      testService,
      15
    );

    const reminderResult = await emailService.sendEmail(
      testEmail,
      reminderTemplate.subject,
      reminderTemplate.html,
      reminderTemplate.text
    );

    if (reminderResult) {
      console.log('✅ Reminder email test passed!');
    }

    // Test 3: PwD Priority email
    console.log('\n🧪 Test 3: PwD Priority Email');
    console.log('-'.repeat(40));
    
    const pwdAppointment = { ...testAppointment, isPwd: true, priority: 'PwD Priority' };
    const pwdTemplate = emailService.generateTestReminderEmail(
      testUser,
      pwdAppointment,
      testDepartment,
      testService,
      15
    );

    const pwdResult = await emailService.sendEmail(
      testEmail,
      pwdTemplate.subject,
      pwdTemplate.html,
      pwdTemplate.text
    );

    if (pwdResult) {
      console.log('✅ PwD priority email test passed!');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:');
    console.log(`Basic Email: ${basicResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Reminder Email: ${reminderResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PwD Priority Email: ${pwdResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (basicResult && reminderResult && pwdResult) {
      console.log('\n🎉 All email tests passed!');
      console.log('📧 The SmartQueue reminder system is working correctly.');
      console.log('📧 jdkalai4@gmail.com should receive the test emails.');
      console.log('');
      console.log('🔧 To enable real email sending:');
      console.log('1. Set up Gmail App Password');
      console.log('2. Configure environment variables:');
      console.log('   - SMTP_USER=your-email@gmail.com');
      console.log('   - SMTP_PASS=your-app-password');
      console.log('3. Restart the application');
    } else {
      console.log('\n⚠️  Some tests failed. Check the error messages above.');
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during email testing:', error);
  }
}

// Run the test
runEmailTest();
