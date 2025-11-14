/**
 * Test Email Extension - HTTP Cloud Function
 * 
 * This function creates a test email document in the 'mail' collection
 * to verify the Firebase Email Extension is working correctly.
 * 
 * Call via: https://REGION-PROJECT.cloudfunctions.net/testEmailExtension
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.testEmailExtension = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🧪 Testing Firebase Email Extension...');

    const db = admin.firestore();
    const timestamp = new Date().toLocaleString();
    
    // Create test email document
    const mailRef = await db.collection('mail').add({
      to: 'kramlig.dotillos@gmail.com',
      from: 'kramlig.dotillos@gmail.com', // Use verified personal email for testing
      message: {
        subject: '✅ EduSync Email Extension Test - Via Cloud Function',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">🎉 Success!</h1>
            <p style="font-size: 16px; color: #374151;">
              Your Firebase Email Extension is working correctly!
            </p>
            
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">✅ Test Details:</h3>
              <ul style="color: #4B5563;">
                <li><strong>Sent via:</strong> Cloud Function testEmailExtension</li>
                <li><strong>Extension:</strong> firebase/firestore-send-email v0.2.4</li>
                <li><strong>SMTP Provider:</strong> SendGrid</li>
                <li><strong>FROM:</strong> official@edusync.ph</li>
                <li><strong>Test Time:</strong> ${timestamp}</li>
              </ul>
            </div>

            <h3>🚀 Next Steps:</h3>
            <ol style="color: #4B5563; line-height: 1.8;">
              <li>Verify this email arrived in your inbox</li>
              <li>Check Firestore mail collection for delivery status</li>
              <li>Deploy parent notification functions</li>
              <li>Test SMS notifications with Semaphore</li>
            </ol>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px;">
                <strong>EduSync School Information System</strong><br>
                Phase 2: Parent Portal - Email Notifications<br>
                Powered by Firebase Extensions & SendGrid
              </p>
            </div>
          </div>
        `,
        text: `
EduSync Email Extension Test

Success! Your Firebase Email Extension is working correctly!

Test Details:
- Sent via: Cloud Function testEmailExtension
- Extension: firebase/firestore-send-email v0.2.4
- SMTP Provider: SendGrid
- FROM: official@edusync.ph
- Test Time: ${timestamp}

Next Steps:
1. Verify this email arrived in your inbox
2. Check Firestore mail collection for delivery status
3. Deploy parent notification functions
4. Test SMS notifications with Semaphore

EduSync School Information System
Phase 2: Parent Portal - Email Notifications
Powered by Firebase Extensions & SendGrid
        `
      }
    });

    console.log(`✅ Test email queued: ${mailRef.id}`);

    // Return response with document ID
    res.status(200).json({
      success: true,
      message: 'Test email queued successfully!',
      documentId: mailRef.id,
      checkStatus: `https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/firestore/data/mail/${mailRef.id}`,
      instructions: [
        '1. Check your email inbox: kramlig.dotillos@gmail.com',
        '2. Open Firestore and check the mail collection document',
        '3. Wait 10-30 seconds for delivery.state to update to SUCCESS',
        '4. Check SendGrid activity log if email doesn\'t arrive'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      troubleshooting: [
        'Check SMTP configuration in Firebase Extension',
        'Verify sender email is verified in SendGrid',
        'Check Cloud Functions logs for detailed errors',
        'Ensure Firestore permissions are correct'
      ]
    });
  }
});
