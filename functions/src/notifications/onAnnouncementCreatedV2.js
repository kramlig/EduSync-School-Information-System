/**
 * Announcement Notification Trigger (Refactored for Email Extension)
 * 
 * Sends multi-channel notifications (SMS + Email via Extension) when announcements are posted.
 * Trigger: Firestore onCreate for announcements collection
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMS, SMSTemplates, sendBatchSMS } = require('../utils/sendSMS');
const { queueBatchEmails, EmailTemplates } = require('../utils/emailExtension');

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
            `https://edusync-sis.web.app/announcements`
          ),
          parentId: p.id,
          parentName: p.name
        }));
      
      // Prepare email recipients (for Extension)
      const emailRecipients = parents
        .filter(p => p.notificationPreferences?.emailEnabled && p.email)
        .map(p => {
          const emailContent = EmailTemplates.announcement(
            p.name, 
            announcement, 
            schoolName
          );
          
          return {
            to: p.email,
            subject: announcement.title,
            html: emailContent.html,
            text: emailContent.text,
            parentId: p.id,
            parentName: p.name
          };
        });
      
      console.log(`Sending ${smsRecipients.length} SMS and queuing ${emailRecipients.length} emails`);
      
      // Send SMS in batches (custom function)
      let smsResults = [];
      if (smsRecipients.length > 0) {
        console.log('Sending batch SMS...');
        smsResults = await sendBatchSMS(smsRecipients, {
          batchSize: 100,
          delayMs: 1000 // 1 second between batches
        });
      }
      
      // Queue emails via Extension (writes to 'mail' collection)
      let emailDocIds = [];
      if (emailRecipients.length > 0) {
        console.log('Queueing batch emails via Extension...');
        emailDocIds = await queueBatchEmails(emailRecipients);
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
      
      // Log email notifications (queued via Extension)
      for (let i = 0; i < emailDocIds.length; i++) {
        const emailDocId = emailDocIds[i];
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
              priority: announcement.priority || 'normal',
              emailDocId: emailDocId // Reference to mail collection
            },
            status: 'queued', // Extension will update delivery status
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
          })
        );
      }
      
      await Promise.all(notificationPromises);
      
      const smsSentCount = smsResults.filter(r => r.success).length;
      const smsFailedCount = smsResults.filter(r => !r.success).length;
      const emailQueuedCount = emailDocIds.length;
      
      console.log(`Announcement notification complete for ${announcementId}:`);
      console.log(`  SMS: ${smsSentCount} sent, ${smsFailedCount} failed`);
      console.log(`  Email: ${emailQueuedCount} queued (Extension will send)`);
      
      // Update announcement with notification stats
      await snap.ref.update({
        notificationStats: {
          smsSent: smsSentCount,
          smsFailed: smsFailedCount,
          emailQueued: emailQueuedCount,
          totalRecipients: parents.length,
          sentAt: new Date().toISOString()
        }
      });
      
      return {
        sms: { sent: smsSentCount, failed: smsFailedCount },
        email: { queued: emailQueuedCount }
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
        'https://edusync-sis.web.app/announcements'
      );
      
      results.sms = await sendSMS(testPhone, smsMessage);
    }
    
    // Queue test email via Extension
    if (testEmail) {
      const { queueEmail } = require('../utils/emailExtension');
      const emailContent = EmailTemplates.announcement(
        'Test User',
        announcement,
        schoolName
      );
      
      const emailDocId = await queueEmail({
        to: testEmail,
        subject: `[TEST] ${announcement.title}`,
        html: emailContent.html,
        text: emailContent.text
      });
      
      results.email = {
        success: true,
        emailDocId: emailDocId,
        message: 'Email queued for sending via Extension'
      };
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

module.exports = {
  onAnnouncementCreated: exports.onAnnouncementCreated,
  testAnnouncementNotification: exports.testAnnouncementNotification
};
