/**
 * Simple Email Test - Just queue and exit
 */

const admin = require('firebase-admin');

// Initialize with production Firebase (not emulator)
admin.initializeApp({
  projectId: 'edusync-sis',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function testEmail() {
  console.log('📧 Sending test email from official@edusync.ph...\n');

  try {
    const mailRef = await db.collection('mail').add({
      to: 'kramlig.dotillos@gmail.com',
      from: 'EduSync <official@edusync.ph>',
      replyTo: 'official@edusync.ph',
      message: {
        subject: '✅ EduSync Email Test - ' + new Date().toLocaleString(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">🎉 Email System Working!</h1>
            <p>Your email is now configured with <strong>official@edusync.ph</strong></p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>✅ Configuration Details:</h3>
              <ul>
                <li><strong>From:</strong> official@edusync.ph</li>
                <li><strong>Domain:</strong> Verified via SendGrid DNS</li>
                <li><strong>Provider:</strong> SendGrid SMTP</li>
                <li><strong>Status:</strong> Active & Working</li>
              </ul>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Deploy Firebase Functions to production</li>
              <li>Test parent notifications</li>
              <li>Launch beta program</li>
            </ol>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
              <strong>EduSync School Information System</strong><br>
              official@edusync.ph | https://edusync.ph
            </p>
          </div>
        `,
        text: `
EduSync Email Test

Your email is now configured with official@edusync.ph

Configuration:
- From: official@edusync.ph
- Domain: Verified via SendGrid DNS
- Provider: SendGrid SMTP
- Status: Active & Working

Next Steps:
1. Deploy Firebase Functions to production
2. Test parent notifications
3. Launch beta program

EduSync School Information System
official@edusync.ph | https://edusync.ph
        `
      }
    });

    console.log('✅ Email queued successfully!');
    console.log('📄 Document ID:', mailRef.id);
    console.log('\n📨 Email will be sent to: kramlig.dotillos@gmail.com');
    console.log('⏰ Check your inbox in 30-60 seconds\n');
    console.log('🔍 To monitor delivery status:');
    console.log(`   firebase firestore:get mail/${mailRef.id}\n`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEmail();
