/**
 * Test Announcement Notification - HTTP Cloud Function
 * 
 * This sends a test announcement email to verify the notification system.
 * Simulates what happens when school posts an announcement.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { queueEmail, EmailTemplates } = require('../utils/emailExtension');

exports.testAnnouncementNotification = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🧪 Testing Announcement Notification System...');

    const db = admin.firestore();
    
    // Test announcement data
    const testAnnouncement = {
      id: 'test-announcement-001',
      title: '🎉 Parent-Teacher Conference Next Week',
      content: `Dear Parents,

We are pleased to invite you to our quarterly Parent-Teacher Conference scheduled for next week.

📅 Date: November 12-14, 2025
⏰ Time: 2:00 PM - 6:00 PM
📍 Location: School Cafeteria

This is an excellent opportunity to:
✓ Discuss your child's academic progress
✓ Review quarterly grades and performance
✓ Address any concerns or questions
✓ Meet with your child's teachers

Please arrive 10 minutes early to sign in at the registration desk. If you cannot attend, please contact the school office to schedule an alternative meeting time.

We look forward to seeing you!`,
      category: 'Academic',
      priority: 'high',
      audience: 'parents',
      postedBy: 'Principal Maria Santos',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const schoolName = 'EduSync School';
    
    // Test parent (you)
    const testParent = {
      email: 'kramlig.dotillos@gmail.com',
      firstName: 'Maria',
      notificationPreferences: {
        emailEnabled: true,
        announcementAlerts: true
      }
    };
    
    console.log(`Sending announcement to: ${testParent.email}`);
    
    // Generate email using template
    const emailContent = EmailTemplates.announcement(
      testParent.firstName,
      testAnnouncement,
      schoolName
    );
    
    // Queue email via Firebase Extension
    const emailDocId = await queueEmail({
      to: testParent.email,
      subject: `📢 ${testAnnouncement.title}`,
      html: emailContent.html,
      text: emailContent.text
    });
    
    console.log(`✅ Announcement email queued: ${emailDocId}`);
    
    // Log to notifications collection (simulating what the real function does)
    const notificationRef = await db.collection('notifications').add({
      type: 'announcement_alert',
      channel: 'email',
      announcementId: testAnnouncement.id,
      announcementTitle: testAnnouncement.title,
      parentEmail: testParent.email,
      status: 'queued',
      metadata: {
        emailDocId: emailDocId,
        category: testAnnouncement.category,
        priority: testAnnouncement.priority
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Notification logged: ${notificationRef.id}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Announcement notification test email sent!',
      data: {
        announcementTitle: testAnnouncement.title,
        category: testAnnouncement.category,
        priority: testAnnouncement.priority,
        parentEmail: testParent.email,
        emailDocId: emailDocId,
        notificationId: notificationRef.id
      },
      checkEmail: {
        inbox: testParent.email,
        subject: `📢 ${testAnnouncement.title}`
      },
      checkFirestore: {
        mail: `https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/firestore/data/mail/${emailDocId}`,
        notification: `https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/firestore/data/notifications/${notificationRef.id}`
      },
      announcement: {
        title: testAnnouncement.title,
        preview: testAnnouncement.content.substring(0, 100) + '...'
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      troubleshooting: [
        'Check emailExtension.js is properly configured',
        'Verify Firebase Extension is active',
        'Check parent email is valid',
        'Review Cloud Functions logs for details'
      ]
    });
  }
});
