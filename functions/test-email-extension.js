/**
 * Test script for Firebase Email Extension
 * 
 * This script creates a test document in the 'mail' collection
 * to verify the Firebase Extension is working correctly.
 * 
 * Usage: node test-email-extension.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'edusync-sis'
});

const db = admin.firestore();

async function testEmailExtension() {
  console.log('🧪 Testing Firebase Email Extension...\n');

  try {
    // Create a test email document
    const mailRef = await db.collection('mail').add({
      to: 'kramlig.dotillos@gmail.com', // Test recipient
      from: 'official@edusync.ph', // Official sender email
      replyTo: 'official@edusync.ph',
      message: {
        subject: '✅ EduSync Email Extension Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">🎉 Email Extension is Working!</h1>
            <p>Congratulations! Your Firebase Email Extension is properly configured and working.</p>
            
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">✅ Configuration Verified:</h3>
              <ul style="color: #4B5563;">
                <li>SMTP connection: Connected to SendGrid</li>
                <li>Sender email: noreply@edusync.web.app</li>
                <li>Mail collection: Monitored by extension</li>
                <li>Delivery: Automatic via extension</li>
              </ul>
            </div>

            <h3>📋 Next Steps:</h3>
            <ol style="color: #4B5563; line-height: 1.8;">
              <li>Check this email arrived successfully</li>
              <li>Verify delivery status in Firestore 'mail' collection</li>
              <li>Deploy notification Cloud Functions</li>
              <li>Test parent notification triggers</li>
            </ol>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px;">
                <strong>EduSync School Information System</strong><br>
                Phase 2: Parent Portal - Email Notifications<br>
                Powered by Firebase Extensions
              </p>
            </div>
          </div>
        `,
        text: `
EduSync Email Extension Test

Congratulations! Your Firebase Email Extension is properly configured and working.

Configuration Verified:
- SMTP connection: Connected to SendGrid
- Sender email: noreply@edusync.web.app
- Mail collection: Monitored by extension
- Delivery: Automatic via extension

Next Steps:
1. Check this email arrived successfully
2. Verify delivery status in Firestore 'mail' collection
3. Deploy notification Cloud Functions
4. Test parent notification triggers

EduSync School Information System
Phase 2: Parent Portal - Email Notifications
Powered by Firebase Extensions
        `
      }
    });

    console.log('✅ Test email queued successfully!');
    console.log(`📧 Document ID: ${mailRef.id}`);
    console.log('\n📊 Monitoring delivery status...\n');

    // Monitor the document for delivery status updates
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 30 seconds

    const checkStatus = setInterval(async () => {
      attempts++;
      
      const mailDoc = await mailRef.get();
      const data = mailDoc.data();

      if (data.delivery) {
        clearInterval(checkStatus);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📬 DELIVERY STATUS UPDATE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Status: ${data.delivery.state}`);
        console.log(`Time: ${new Date(data.delivery.startTime._seconds * 1000).toLocaleString()}`);
        
        if (data.delivery.state === 'SUCCESS') {
          console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
          console.log('📨 Check your inbox: kramlig.dotillos@gmail.com');
          console.log('\n🎉 Firebase Extension is working perfectly!');
        } else if (data.delivery.state === 'ERROR') {
          console.log('\n❌ EMAIL FAILED TO SEND');
          console.log('Error:', data.delivery.error);
          console.log('\n🔍 Troubleshooting:');
          console.log('1. Check SMTP credentials in extension config');
          console.log('2. Verify sender email is verified in SendGrid');
          console.log('3. Check SendGrid activity log');
        } else if (data.delivery.state === 'PENDING') {
          console.log('\n⏳ Email is still being processed...');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        process.exit(0);
      } else {
        process.stdout.write(`\r⏳ Waiting for delivery status... (${attempts}s)`);
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkStatus);
        console.log('\n\n⚠️  Timeout waiting for delivery status');
        console.log('📝 The email may still be processing. Check:');
        console.log(`   Firestore: mail/${mailRef.id}`);
        console.log('   SendGrid Activity Log');
        process.exit(1);
      }
    }, 1000);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\n🔍 Make sure:');
    console.error('1. Firebase project is set correctly');
    console.error('2. You have Firestore permissions');
    console.error('3. Extension is installed and configured');
    process.exit(1);
  }
}

// Run the test
testEmailExtension();
