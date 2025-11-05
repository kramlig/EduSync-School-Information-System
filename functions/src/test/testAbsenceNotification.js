/**
 * Test Absence Notification - HTTP Cloud Function
 * 
 * This sends a test absence alert email to verify the notification system.
 * Simulates what happens when a student is marked absent.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { queueEmail, EmailTemplates } = require('../utils/emailExtension');

exports.testAbsenceNotification = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🧪 Testing Absence Notification System...');

    const db = admin.firestore();
    
    // Test data - student marked absent
    const testAbsence = {
      studentId: 'test-student-001',
      studentName: 'Juan Dela Cruz',
      date: new Date().toISOString(),
      reason: 'Feeling unwell, stayed home to rest',
      status: 'A' // Absent
    };
    
    const schoolName = 'EduSync School';
    const schoolPhone = '(02) 8123-4567';
    
    // Test parent (you)
    const testParent = {
      email: 'kramlig.dotillos@gmail.com',
      firstName: 'Maria',
      notificationPreferences: {
        emailEnabled: true,
        absenceAlerts: true
      }
    };
    
    console.log(`Sending absence alert to: ${testParent.email}`);
    
    // Generate email using template
    const emailContent = EmailTemplates.absenceAlert(
      testParent.firstName,
      testAbsence.studentName,
      testAbsence.date,
      testAbsence.reason,
      schoolName,
      schoolPhone
    );
    
    // Queue email via Firebase Extension
    const emailDocId = await queueEmail({
      to: testParent.email,
      subject: `⚠️ Absence Alert - ${testAbsence.studentName}`,
      html: emailContent.html,
      text: emailContent.text
    });
    
    console.log(`✅ Absence email queued: ${emailDocId}`);
    
    // Log to notifications collection (simulating what the real function does)
    const notificationRef = await db.collection('notifications').add({
      type: 'absence_alert',
      channel: 'email',
      studentId: testAbsence.studentId,
      studentName: testAbsence.studentName,
      parentEmail: testParent.email,
      date: testAbsence.date,
      reason: testAbsence.reason,
      status: 'queued',
      metadata: {
        emailDocId: emailDocId,
        isTestNotification: true
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Notification logged: ${notificationRef.id}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Absence notification test email sent!',
      data: {
        studentName: testAbsence.studentName,
        date: new Date(testAbsence.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        reason: testAbsence.reason,
        parentEmail: testParent.email,
        emailDocId: emailDocId,
        notificationId: notificationRef.id
      },
      checkEmail: {
        inbox: testParent.email,
        subject: `⚠️ Absence Alert - ${testAbsence.studentName}`
      },
      checkFirestore: {
        mail: `https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/firestore/data/mail/${emailDocId}`,
        notification: `https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/firestore/data/notifications/${notificationRef.id}`
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      troubleshooting: [
        'Check emailExtension.js has absenceAlert template',
        'Verify Firebase Extension is active',
        'Check parent email is valid',
        'Review Cloud Functions logs for details'
      ]
    });
  }
});
