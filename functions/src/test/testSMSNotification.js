/**
 * Test SMS Notification - HTTP Cloud Function
 * 
 * This sends a test SMS via Semaphore to verify SMS notifications are working.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMS, SMSTemplates } = require('../utils/sendSMS');

exports.testSMSNotification = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🧪 Testing SMS Notification System...');

    const db = admin.firestore();
    
    // Test phone number - get from query param or use default
    const testPhone = req.query.phone || process.env.TEST_PHONE_NUMBER || '+639171234567';
    
    // Test data for absence alert
    const testStudent = {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      grade: '7',
      section: 'St. Peter'
    };
    
    const testDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const schoolPhone = process.env.SCHOOL_PHONE || '(043) 123-4567';
    
    // Generate SMS message using template
    const smsMessage = SMSTemplates.absenceAlert(
      `${testStudent.firstName} ${testStudent.lastName}`,
      testDate,
      schoolPhone
    );
    
    console.log(`Sending test SMS to: ${testPhone}`);
    console.log(`Message: ${smsMessage}`);
    
    // Send SMS via Semaphore
    const smsResult = await sendSMS(testPhone, smsMessage, {
      senderId: 'EDUSYNC' // Optional: Your sender name (max 11 chars)
    });
    
    console.log(`SMS Result:`, smsResult);
    
    // Log to notifications collection (simulating what the real function does)
    const notificationRef = await db.collection('notifications').add({
      type: 'absence_alert_test',
      channel: 'sms',
      studentName: `${testStudent.firstName} ${testStudent.lastName}`,
      phoneNumber: testPhone,
      message: smsMessage,
      status: smsResult.success ? 'sent' : 'failed',
      metadata: {
        messageId: smsResult.messageId || null,
        cost: smsResult.cost || null,
        credits: smsResult.credits || null,
        error: smsResult.error || null
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Notification logged: ${notificationRef.id}`);

    // Return success response
    res.status(200).json({
      success: smsResult.success,
      message: smsResult.success 
        ? 'Test SMS sent successfully!' 
        : 'SMS failed to send',
      data: {
        student: `${testStudent.firstName} ${testStudent.lastName}`,
        phoneNumber: testPhone,
        messageLength: smsMessage.length,
        messageId: smsResult.messageId,
        cost: smsResult.cost,
        credits: smsResult.credits,
        notificationId: notificationRef.id
      },
      smsMessage: smsMessage,
      checkPhone: `Check SMS on: ${testPhone}`,
      checkFirestore: {
        notification: `https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/firestore/data/notifications/${notificationRef.id}`
      },
      semaphoreResponse: smsResult.rawResponse
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      troubleshooting: [
        'Check SEMAPHORE_API_KEY is set in functions/.env',
        'Verify Semaphore account has credits',
        'Check phone number format (+639xxxxxxxxx)',
        'Review sendSMS.js configuration',
        'Check Cloud Functions logs for details'
      ]
    });
  }
});
