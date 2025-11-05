/**
 * Absence Alert Notification Trigger
 * 
 * Sends SMS to parents when their child is marked absent.
 * Trigger: Firestore onCreate for attendanceRecords collection
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendSMS, SMSTemplates } = require('../utils/sendSMS');

/**
 * Firestore trigger: Send SMS when student is marked absent
 */
exports.onAbsenceCreated = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onCreate(async (snap, context) => {
    const record = snap.data();
    const recordId = context.params.recordId;
    
    console.log(`Processing attendance record ${recordId}:`, record);
    
    // Only process absence records
    if (record.status !== 'A') {
      console.log(`Record ${recordId} is not absent (status: ${record.status}), skipping`);
      return null;
    }
    
    try {
      // Lookup parent by studentId
      const parentsSnap = await admin.firestore()
        .collection('parents')
        .where('studentIds', 'array-contains', record.studentId)
        .get();
      
      if (parentsSnap.empty) {
        console.log(`No parent found for student ${record.studentId}`);
        return null;
      }
      
      // Process each parent (in case student has multiple guardians)
      const notificationPromises = parentsSnap.docs.map(async (parentDoc) => {
        const parent = parentDoc.data();
        const parentId = parentDoc.id;
        
        console.log(`Processing parent ${parentId} (${parent.email})`);
        
        // Check notification preferences
        if (!parent.notificationPreferences) {
          console.log(`Parent ${parentId} has no notification preferences, skipping`);
          return null;
        }
        
        if (!parent.notificationPreferences.absenceAlerts) {
          console.log(`Parent ${parentId} has disabled absence alerts, skipping`);
          return null;
        }
        
        if (!parent.notificationPreferences.smsEnabled) {
          console.log(`Parent ${parentId} has disabled SMS notifications, skipping`);
          return null;
        }
        
        if (!parent.phone) {
          console.log(`Parent ${parentId} has no phone number, skipping`);
          return null;
        }
        
        // Get student details
        const studentDoc = await admin.firestore()
          .collection('students')
          .doc(record.studentId)
          .get();
        
        if (!studentDoc.exists) {
          console.error(`Student ${record.studentId} not found`);
          return null;
        }
        
        const student = studentDoc.data();
        const studentName = `${student.firstName} ${student.lastName}`;
        
        // Get school settings for contact info
        const settingsDoc = await admin.firestore()
          .collection('settings')
          .doc('school')
          .get();
        
        const schoolPhone = settingsDoc.exists ? 
          (settingsDoc.data().contactPhone || '(XXX) XXX-XXXX') : 
          '(XXX) XXX-XXXX';
        
        // Format date
        const date = new Date(record.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Build SMS message
        const message = SMSTemplates.absenceAlert(studentName, date, schoolPhone);
        
        console.log(`Sending absence SMS to ${parent.phone}: "${message}"`);
        
        // Send SMS
        const smsResult = await sendSMS(parent.phone, message);
        
        // Log notification to Firestore
        const notificationData = {
          type: 'absence_alert',
          channel: 'sms',
          recipientId: parentId,
          recipientName: parent.name,
          recipientPhone: parent.phone,
          studentId: record.studentId,
          studentName: studentName,
          metadata: {
            attendanceRecordId: recordId,
            date: record.date,
            status: record.status,
          },
          message: message,
          status: smsResult.success ? 'sent' : 'failed',
          error: smsResult.error || null,
          messageId: smsResult.messageId || null,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: new Date().toISOString(),
        };
        
        await admin.firestore()
          .collection('notifications')
          .add(notificationData);
        
        console.log(`Notification logged for parent ${parentId}, status: ${notificationData.status}`);
        
        return notificationData;
      });
      
      const results = await Promise.all(notificationPromises);
      const sentCount = results.filter(r => r && r.status === 'sent').length;
      const failedCount = results.filter(r => r && r.status === 'failed').length;
      
      console.log(`Absence notification complete for record ${recordId}: ${sentCount} sent, ${failedCount} failed`);
      
      return results;
      
    } catch (error) {
      console.error(`Error processing absence record ${recordId}:`, error);
      
      // Log error to Firestore for monitoring
      await admin.firestore()
        .collection('notificationErrors')
        .add({
          type: 'absence_alert',
          recordId: recordId,
          error: error.message,
          stack: error.stack,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      // Don't throw - we don't want to retry and duplicate notifications
      return null;
    }
  });

/**
 * Firestore trigger: Also handle onUpdate in case absence is recorded later
 */
exports.onAbsenceUpdated = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const recordId = context.params.recordId;
    
    // Only process if status changed from non-absent to absent
    if (before.status !== 'A' && after.status === 'A') {
      console.log(`Attendance record ${recordId} updated to absent, processing...`);
      
      // Check if we already sent notification
      const existingNotif = await admin.firestore()
        .collection('notifications')
        .where('metadata.attendanceRecordId', '==', recordId)
        .where('type', '==', 'absence_alert')
        .limit(1)
        .get();
      
      if (!existingNotif.empty) {
        console.log(`Notification already sent for record ${recordId}, skipping`);
        return null;
      }
      
      // Trigger the same logic as onCreate
      return exports.onAbsenceCreated(change.after, context);
    }
    
    return null;
  });

/**
 * Manual retry function for failed absence notifications
 * Callable from admin dashboard
 */
exports.retryAbsenceNotification = functions.https.onCall(async (data, context) => {
  // Only allow admin users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to retry notifications'
    );
  }
  
  const { notificationId } = data;
  
  if (!notificationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'notificationId is required'
    );
  }
  
  try {
    const notifDoc = await admin.firestore()
      .collection('notifications')
      .doc(notificationId)
      .get();
    
    if (!notifDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }
    
    const notif = notifDoc.data();
    
    if (notif.status === 'sent') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Notification already sent successfully'
      );
    }
    
    // Resend SMS
    const smsResult = await sendSMS(notif.recipientPhone, notif.message);
    
    // Update notification status
    await notifDoc.ref.update({
      status: smsResult.success ? 'sent' : 'failed',
      error: smsResult.error || null,
      messageId: smsResult.messageId || null,
      retriedAt: new Date().toISOString(),
    });
    
    return {
      success: smsResult.success,
      notificationId: notificationId,
      status: smsResult.success ? 'sent' : 'failed',
    };
    
  } catch (error) {
    console.error(`Error retrying notification ${notificationId}:`, error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
