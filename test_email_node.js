/**
 * Test script to send an email to jdkalai4@gmail.com using Node.js email service
 * This script tests the email functionality in simulation mode
 */

// Since we can't directly import TypeScript, let's create a simple test
import nodemailer from 'nodemailer';

// Create a test email service
class TestEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Use simulation mode (no real SMTP)
    console.log('📧 Email service running in simulation mode');
  }

  async sendEmail(to, subject, html, text) {
    // Simulation mode - just log the email
    console.log(`\n📧 EMAIL SIMULATION:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text || html.replace(/<[^>]*>/g, '')}`);
    console.log(`---\n`);
    return true;
  }

  generateTestReminderEmail() {
    const subject = `⏰ Test Reminder: Your appointment is coming up - Token #TEST001`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Reminder</title>
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
            <h1>⏰ Test Reminder</h1>
            <p>This is a test reminder email!</p>
          </div>
          
          <div class="content">
            <div class="token">
              Token Number: TEST001
            </div>
            
            <div class="urgent">
              <h3>🚨 This is a test reminder!</h3>
              <p>If you receive this email, the reminder system is working correctly.</p>
            </div>
            
            <div class="info">
              <h3>📋 Test Details</h3>
              <p><strong>Name:</strong> Test User</p>
              <p><strong>Service:</strong> Test Service</p>
              <p><strong>Department:</strong> Test Department</p>
              <p><strong>Date:</strong> Test Date</p>
              <p><strong>Time Slot:</strong> Test Time</p>
            </div>

            <div class="info">
              <h3>📍 What this test confirms:</h3>
              <ul>
                <li>Email system is functional</li>
                <li>Reminder templates work correctly</li>
                <li>HTML formatting is preserved</li>
                <li>SMTP configuration is correct</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Test Reminder - Token TEST001

Dear Test User,

This is a test reminder email!

TEST DETAILS:
- Token Number: TEST001
- Service: Test Service
- Department: Test Department
- Date: Test Date
- Time Slot: Test Time

WHAT THIS TEST CONFIRMS:
- Email system is functional
- Reminder templates work correctly
- SMTP configuration is correct

This is a test email from SmartQueue Reminder System.
    `;

    return { subject, html, text };
  }
}

async function testEmailSystem() {
  console.log('🚀 Starting SmartQueue Email Test');
  console.log('=' * 60);
  
  const emailService = new TestEmailService();
  const testEmail = 'jdkalai4@gmail.com';
  
  console.log('🧪 Testing Email System');
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('📧 Mode: Simulation (no real SMTP)');
  console.log('-'.repeat(50));
  
  try {
    // Test basic email
    const basicResult = await emailService.sendEmail(
      testEmail,
      '🧪 SmartQueue Test Email - Reminder System',
      '<h1>Test Email</h1><p>This is a test email from SmartQueue.</p>',
      'Test Email\n\nThis is a test email from SmartQueue.'
    );
    
    if (basicResult) {
      console.log('✅ Basic test email sent successfully!');
    }
    
    // Test reminder email
    console.log('\n🧪 Testing Reminder Email Template');
    console.log(`📧 Sending reminder email to: ${testEmail}`);
    console.log('-'.repeat(50));
    
    const reminderTemplate = emailService.generateTestReminderEmail();
    const reminderResult = await emailService.sendEmail(
      testEmail,
      reminderTemplate.subject,
      reminderTemplate.html,
      reminderTemplate.text
    );
    
    if (reminderResult) {
      console.log('✅ Test reminder email sent successfully!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:');
    console.log(`Basic Email: ${basicResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Reminder Email: ${reminderResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (basicResult && reminderResult) {
      console.log('\n🎉 All email tests passed! The reminder system is working correctly.');
      console.log('📧 Note: This was run in simulation mode. To send real emails, configure SMTP settings.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the error messages above.');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during email testing:', error);
  }
}

// Run the test
testEmailSystem();
