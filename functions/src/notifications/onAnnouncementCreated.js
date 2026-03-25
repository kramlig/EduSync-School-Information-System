/**
 * Announcement Notification Trigger
 * 
 * Sends multi-channel notifications (SMS + Email) when announcements are posted.
 * Trigger: Firestore onCreate for announcements collection
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMS, SMSTemplates, sendBatchSMS } = require('../utils/sendSMS');
const { sendEmail, EmailTemplates, sendBatchEmails } = require('../utils/sendEmail');

/**
 * Firestore trigger: Send notifications when announcement is created
 */
exports.onAnnouncementCreated = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    const announcement = snap.data();
    const announcementId = context.params.announcementId;
    
    console.log(`Processing announcement ${announcementId}:`, announcement.title);
    
    // Filter by target audience
    if (!['parents', 'all'].includes(announcement.target)) {
      console.log(`Announcement ${announcementId} not targeted to parents, skipping`);
      return null;
    }
    
    try {
      // Get all parents with notification preferences enabled
      const parentsSnap = await admin.firestore()
        .collection('parents')
        .where('notificationPreferences.announcementAlerts', '==', true)
        .get();
      
      if (parentsSnap.empty) {
        console.log('No parents with announcement alerts enabled');
        return null;
      }
      
      const parents = parentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${parents.length} parents with announcement alerts enabled`);
      
      // Get school settings
      const settingsDoc = await admin.firestore()
        .collection('settings')
        .doc('school')
        .get();
      
      const schoolName = settingsDoc.exists ? 
        (settingsDoc.data().name || 'Your School') : 
        'Your School';
      
      // Prepare SMS recipients
      const smsRecipients = parents
        .filter(p => p.notificationPreferences?.smsEnabled && p.phone)
        .map(p => ({
          phone: p.phone,
          message: SMSTemplates.announcement(
            announcement.title,
            `https://edusync.ph/announcements`
          ),
          parentId: p.id,
          parentName: p.name
        }));
      
      // Prepare email recipients
      const emailRecipients = parents
        .filter(p => p.notificationPreferences?.emailEnabled && p.email)
        .map(p => ({
          to: p.email,
          subject: announcement.title,
          ...EmailTemplates.announcement(p.name, announcement, schoolName),
          parentId: p.id,
          parentName: p.name
        }));
      
      console.log(`Sending ${smsRecipients.length} SMS and ${emailRecipients.length} emails`);
      
      // Send SMS in batches
      let smsResults = [];
      if (smsRecipients.length > 0) {
        console.log('Sending batch SMS...');
        smsResults = await sendBatchSMS(smsRecipients, {
          batchSize: 100,
          delayMs: 1000 // 1 second between batches
        });
      }
      
      // Send emails in batches
      let emailResults = [];
      if (emailRecipients.length > 0) {
        console.log('Sending batch emails...');
        emailResults = await sendBatchEmails(emailRecipients, {
          batchSize: 100,
          delayMs: 1000
        });
      }
      
      // Log all notifications to Firestore
      const notificationPromises = [];
      
      // Log SMS notifications
      for (let i = 0; i < smsResults.length; i++) {
        const result = smsResults[i];
        const recipient = smsRecipients[i];
        
        notificationPromises.push(
          admin.firestore().collection('notifications').add({
            type: 'announcement_alert',
            channel: 'sms',
            recipientId: recipient.parentId,
            recipientName: recipient.parentName,
            recipientPhone: recipient.phone,
            metadata: {
              announcementId: announcementId,
              announcementTitle: announcement.title,
              priority: announcement.priority || 'normal'
            },
            message: recipient.message,
            status: result.success ? 'sent' : 'failed',
            error: result.error || null,
            messageId: result.messageId || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
          })
        );
      }
      
      // Log email notifications
      for (let i = 0; i < emailResults.length; i++) {
        const result = emailResults[i];
        const recipient = emailRecipients[i];
        
        notificationPromises.push(
          admin.firestore().collection('notifications').add({
            type: 'announcement_alert',
            channel: 'email',
            recipientId: recipient.parentId,
            recipientName: recipient.parentName,
            recipientEmail: recipient.to,
            metadata: {
              announcementId: announcementId,
              announcementTitle: announcement.title,
              priority: announcement.priority || 'normal'
            },
            status: result.success ? 'sent' : 'failed',
            error: result.error || null,
            messageId: result.messageId || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
          })
        );
      }
      
      await Promise.all(notificationPromises);
      
      const smsSentCount = smsResults.filter(r => r.success).length;
      const smsFailedCount = smsResults.filter(r => !r.success).length;
      const emailSentCount = emailResults.filter(r => r.success).length;
      const emailFailedCount = emailResults.filter(r => !r.success).length;
      
      console.log(`Announcement notification complete for ${announcementId}:`);
      console.log(`  SMS: ${smsSentCount} sent, ${smsFailedCount} failed`);
      console.log(`  Email: ${emailSentCount} sent, ${emailFailedCount} failed`);
      
      // Update announcement with notification stats
      await snap.ref.update({
        notificationStats: {
          smsSent: smsSentCount,
          smsFailed: smsFailedCount,
          emailSent: emailSentCount,
          emailFailed: emailFailedCount,
          totalRecipients: parents.length,
          sentAt: new Date().toISOString()
        }
      });
      
      return {
        sms: { sent: smsSentCount, failed: smsFailedCount },
        email: { sent: emailSentCount, failed: emailFailedCount }
      };
      
    } catch (error) {
      console.error(`Error processing announcement notification:`, error);
      
      // Log error to Firestore
      await admin.firestore()
        .collection('notificationErrors')
        .add({
          type: 'announcement_alert',
          announcementId: announcementId,
          error: error.message,
          stack: error.stack,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      // Don't throw - we don't want to retry and duplicate notifications
      return null;
    }
  });

/**
 * Manual function to resend announcement to parents who failed
 * Callable from admin dashboard
 */
exports.resendAnnouncementNotification = functions.https.onCall(async (data, context) => {
  // Only allow admin users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to resend notifications'
    );
  }
  
  const { announcementId } = data;
  
  if (!announcementId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'announcementId is required'
    );
  }
  
  try {
    // Get announcement
    const announcementDoc = await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!announcementDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Announcement not found');
    }
    
    const announcement = announcementDoc.data();
    
    // Get failed notifications for this announcement
    const failedNotifsSnap = await admin.firestore()
      .collection('notifications')
      .where('metadata.announcementId', '==', announcementId)
      .where('status', '==', 'failed')
      .get();
    
    if (failedNotifsSnap.empty) {
      return {
        success: true,
        message: 'No failed notifications to resend',
        resent: 0
      };
    }
    
    console.log(`Resending ${failedNotifsSnap.size} failed notifications for announcement ${announcementId}`);
    
    // Get school settings
    const settingsDoc = await admin.firestore()
      .collection('settings')
      .doc('school')
      .get();
    
    const schoolName = settingsDoc.exists ? 
      (settingsDoc.data().name || 'Your School') : 
      'Your School';
    
    const resendPromises = failedNotifsSnap.docs.map(async (notifDoc) => {
      const notif = notifDoc.data();
      
      let result;
      
      if (notif.channel === 'sms') {
        // Resend SMS
        result = await sendSMS(
          notif.recipientPhone,
          notif.message || SMSTemplates.announcement(
            announcement.title,
            'https://edusync.ph/announcements'
          )
        );
      } else if (notif.channel === 'email') {
        // Resend email
        const emailContent = EmailTemplates.announcement(
          notif.recipientName,
          announcement,
          schoolName
        );
        
        result = await sendEmail({
          to: notif.recipientEmail,
          subject: announcement.title,
          html: emailContent.html,
          text: emailContent.text
        });
      } else {
        return null;
      }
      
      // Update notification status
      await notifDoc.ref.update({
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        messageId: result.messageId || null,
        retriedAt: new Date().toISOString(),
      });
      
      return result;
    });
    
    const results = await Promise.all(resendPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    return {
      success: true,
      resent: successCount,
      total: failedNotifsSnap.size
    };
    
  } catch (error) {
    console.error('Error resending announcement notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Test function to send announcement to test recipients
 * Useful for testing without spamming all parents
 */
exports.testAnnouncementNotification = functions.https.onCall(async (data, context) => {
  // Only allow admin users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }
  
  const { announcementId, testEmail, testPhone } = data;
  
  if (!announcementId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'announcementId is required'
    );
  }
  
  try {
    const announcementDoc = await admin.firestore()
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!announcementDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Announcement not found');
    }
    
    const announcement = announcementDoc.data();
    
    // Get school settings
    const settingsDoc = await admin.firestore()
      .collection('settings')
      .doc('school')
      .get();
    
    const schoolName = settingsDoc.exists ? 
      (settingsDoc.data().name || 'Your School') : 
      'Your School';
    
    const results = {};
    
    // Send test SMS
    if (testPhone) {
      const smsMessage = SMSTemplates.announcement(
        announcement.title,
        'https://edusync.ph/announcements'
      );
      
      results.sms = await sendSMS(testPhone, smsMessage);
    }
    
    // Send test email
    if (testEmail) {
      const emailContent = EmailTemplates.announcement(
        'Test User',
        announcement,
        schoolName
      );
      
      results.email = await sendEmail({
        to: testEmail,
        subject: `[TEST] ${announcement.title}`,
        html: emailContent.html,
        text: emailContent.text
      });
    }
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    console.error('Error sending test announcement:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
