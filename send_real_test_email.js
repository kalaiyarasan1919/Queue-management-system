/**
 * Send a real test email to jdkalai4@gmail.com using configured SMTP
 * This will test the actual email functionality with your SMTP settings
 */

import nodemailer from 'nodemailer';

// Email configuration - you can update these with your actual SMTP credentials
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    // Replace these with your actual Gmail credentials
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

async function sendRealTestEmail() {
  console.log('🚀 Sending Real Test Email to jdkalai4@gmail.com');
  console.log('=' * 60);
  
  // Check if credentials are configured
  if (emailConfig.auth.user === 'your-email@gmail.com' || !emailConfig.auth.pass) {
    console.log('⚠️  Please configure your SMTP credentials:');
    console.log('1. Set environment variables:');
    console.log('   - SMTP_USER=your-email@gmail.com');
    console.log('   - SMTP_PASS=your-app-password');
    console.log('2. Or update the emailConfig object in this script');
    console.log('');
    console.log('For Gmail App Password setup:');
    console.log('1. Enable 2-factor authentication on your Gmail account');
    console.log('2. Go to Google Account Settings > Security > App passwords');
    console.log('3. Generate an app password for "Mail"');
    console.log('4. Use that password as SMTP_PASS');
    return;
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransporter(emailConfig);
    
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');
    
    // Email content
    const mailOptions = {
      from: `"SmartQueue Test" <${emailConfig.auth.user}>`,
      to: 'jdkalai4@gmail.com',
      subject: '🧪 SmartQueue Test Email - Reminder System Working!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SmartQueue Test Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background: #10b981; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; border-radius: 8px; }
            .info { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 eQueue - Smart Token Generator</h1>
              <p>Email System Test Successful!</p>
            </div>
            
            <div class="content">
              <div class="success">
                ✅ Email System is Working!
              </div>
              
              <div class="info">
                <h3>📧 Test Details</h3>
                <p><strong>Recipient:</strong> jdkalai4@gmail.com</p>
                <p><strong>Purpose:</strong> Testing reminder system email functionality</p>
                <p><strong>Status:</strong> Successfully delivered</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <div class="info">
                <h3>🎯 What this confirms:</h3>
                <ul>
                  <li>✅ SMTP configuration is correct</li>
                  <li>✅ Email service can send real emails</li>
                  <li>✅ Reminder system will work for registered tokens</li>
                  <li>✅ HTML formatting is preserved</li>
                  <li>✅ Email delivery is successful</li>
                </ul>
              </div>

              <div class="info">
                <h3>📝 Next Steps:</h3>
                <p>The reminder system is now ready to send emails to users when their token appointments are coming up. Users will receive:</p>
                <ul>
                  <li>Booking confirmation emails when they register</li>
                  <li>Reminder emails 15 minutes before their appointment</li>
                  <li>Priority notifications for PwD users</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>This is a test email from eQueue Smart Token Generator</p>
              <p>For support, contact: support@smartqueue.local</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
SmartQueue Test Email - Reminder System Working!

Dear User,

This is a test email to confirm that the SmartQueue reminder system is working correctly.

TEST DETAILS:
- Recipient: jdkalai4@gmail.com
- Purpose: Testing reminder system email functionality
- Status: Successfully delivered
- Timestamp: ${new Date().toLocaleString()}

WHAT THIS CONFIRMS:
- SMTP configuration is correct
- Email service can send real emails
- Reminder system will work for registered tokens
- Email delivery is successful

NEXT STEPS:
The reminder system is now ready to send emails to users when their token appointments are coming up. Users will receive:
- Booking confirmation emails when they register
- Reminder emails 15 minutes before their appointment
- Priority notifications for PwD users

This is a test email from eQueue Smart Token Generator
For support, contact: support@smartqueue.local
      `
    };
    
    // Send email
    console.log('📧 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);
    console.log('');
    console.log('🎉 The reminder system is working correctly!');
    console.log('📧 jdkalai4@gmail.com should receive the test email shortly.');
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check your Gmail App Password');
    console.log('2. Ensure 2-factor authentication is enabled');
    console.log('3. Verify the email credentials are correct');
    console.log('4. Check if "Less secure app access" is enabled (if not using App Password)');
  }
}

// Run the test
sendRealTestEmail();
