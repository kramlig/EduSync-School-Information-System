/**
 * Absence Notification V2 - Email Version
 * 
 * Sends email notifications when a student is marked absent.
 * This replaces the SMS-only version with email-based alerts.
 * 
 * Trigger: onCreate/onUpdate on attendanceRecords where status='A' (Absent)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { queueEmail, EmailTemplates } = require('../utils/emailExtension');

/**
 * Triggers when an attendance record is created/updated with status='A' (Absent)
 */
exports.onAbsenceCreated = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const recordId = context.params.recordId;

    try {
      // Get the attendance record
      const after = change.after.exists ? change.after.data() : null;
      const before = change.before.exists ? change.before.data() : null;

      // Only process if status is 'A' (Absent)
      if (!after || after.status !== 'A') {
        console.log('Not an absence record, skipping notification');
        return null;
      }

      // Skip if this is an update and status was already 'A' (avoid duplicate notifications)
      if (before && before.status === 'A') {
        console.log('Status was already absent, skipping duplicate notification');
        return null;
      }

      console.log(`🚨 Absence detected: ${recordId}`);

      const { studentId, date, reason } = after;

      if (!studentId || !date) {
        console.error('Missing required fields: studentId or date');
        return null;
      }

      // Get student information
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        console.error(`Student not found: ${studentId}`);
        return null;
      }

      const student = studentDoc.data();
      const studentName = `${student.firstName} ${student.lastName}`;

      // Get parent information
      if (!student.parentId) {
        console.log(`No parent linked to student: ${studentId}`);
        return null;
      }

      const parentDoc = await db.collection('parents').doc(student.parentId).get();
      if (!parentDoc.exists) {
        console.error(`Parent not found: ${student.parentId}`);
        return null;
      }

      const parent = parentDoc.data();

      // Check notification preferences
      const prefs = parent.notificationPreferences || {};
      if (prefs.emailEnabled === false || prefs.absenceAlerts === false) {
        console.log(`Parent has disabled absence email notifications: ${parent.email}`);
        return null;
      }

      // Get school settings for phone number
      const settingsDoc = await db.collection('settings').doc('school').get();
      const schoolSettings = settingsDoc.exists ? settingsDoc.data() : {};
      const schoolName = schoolSettings.schoolName || 'Your School';
      const schoolPhone = schoolSettings.phone || '(XXX) XXX-XXXX';

      console.log(`Sending absence email to: ${parent.email}`);

      // Generate email using template
      const emailContent = EmailTemplates.absenceAlert(
        parent.firstName || 'Parent',
        studentName,
        date,
        reason || null,
        schoolName,
        schoolPhone
      );

      // Queue email via Firebase Extension
      const emailDocId = await queueEmail({
        to: parent.email,
        subject: `⚠️ Absence Alert - ${studentName}`,
        html: emailContent.html,
        text: emailContent.text
      });

      console.log(`✅ Absence email queued: ${emailDocId}`);

      // Log notification to collection
      const notificationRef = await db.collection('notifications').add({
        type: 'absence_alert',
        channel: 'email',
        studentId: studentId,
        studentName: studentName,
        parentEmail: parent.email,
        attendanceRecordId: recordId,
        date: date,
        reason: reason || null,
        status: 'queued',
        metadata: {
          emailDocId: emailDocId
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Notification logged: ${notificationRef.id}`);

      return {
        success: true,
        emailDocId: emailDocId,
        notificationId: notificationRef.id
      };

    } catch (error) {
      console.error('❌ Error sending absence notification:', error);
      
      // Log failed notification
      try {
        await db.collection('notifications').add({
          type: 'absence_alert',
          channel: 'email',
          status: 'failed',
          error: error.message,
          recordId: recordId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      // Don't throw - we don't want to retry failed notifications
      return null;
    }
  });
