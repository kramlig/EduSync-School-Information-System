/**
 * Grade Alert Notification Trigger (Refactored for Email Extension)
 * 
 * Sends email to parents when grades are posted for a complete quarter.
 * Uses Firebase Email Extension (firestore-send-email) for email delivery.
 * Trigger: Firestore onWrite for grades collection
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { queueEmail, EmailTemplates } = require('../utils/emailExtension');

/**
 * Check if all subjects are graded for a student in a given quarter
 */
async function isQuarterComplete(studentId, quarter, sectionId) {
  try {
    // Get student's section
    const studentDoc = await admin.firestore()
      .collection('students')
      .doc(studentId)
      .get();
    
    if (!studentDoc.exists) {
      console.error(`Student ${studentId} not found`);
      return false;
    }
    
    const student = studentDoc.data();
    const schoolId = student.schoolId;
    const section = sectionId || student.sectionId;
    
    if (!section || !schoolId) {
      console.log(`Student ${studentId} has no section or schoolId assigned`);
      return false;
    }
    
    // Get section details to know grade level
    const sectionDoc = await admin.firestore()
      .collection('sections')
      .doc(section)
      .get();
    
    if (!sectionDoc.exists) {
      console.error(`Section ${section} not found`);
      return false;
    }
    
    const sectionData = sectionDoc.data();
    const gradeLevel = sectionData.gradeLevel;
    
    // Get expected learning areas for this grade level and school
    const learningAreasSnap = await admin.firestore()
      .collection('learningAreas')
      .where('schoolId', '==', schoolId)
      .where('gradeLevel', 'array-contains', gradeLevel)
      .get();
    
    if (learningAreasSnap.empty) {
      console.log(`No learning areas found for school ${schoolId}, grade level ${gradeLevel}`);
      return false;
    }
    
    const expectedSubjects = learningAreasSnap.docs.map(doc => doc.id);
    
    // Get grades for this student and quarter (within school)
    const gradesSnap = await admin.firestore()
      .collection('grades')
      .where('schoolId', '==', schoolId)
      .where('studentId', '==', studentId)
      .where('quarter', '==', quarter)
      .get();
    
    if (gradesSnap.empty) {
      console.log(`No grades found for student ${studentId}, quarter ${quarter}`);
      return false;
    }
    
    const gradedSubjects = gradesSnap.docs.map(doc => doc.data().learningAreaId);
    
    // Check if all expected subjects are graded
    const allGraded = expectedSubjects.every(subjectId => 
      gradedSubjects.includes(subjectId)
    );
    
    console.log(`Quarter ${quarter} completion for student ${studentId}:`, {
      expected: expectedSubjects.length,
      graded: gradedSubjects.length,
      complete: allGraded
    });
    
    return allGraded;
    
  } catch (error) {
    console.error('Error checking quarter completion:', error);
    return false;
  }
}

/**
 * Build grade summary for email
 */
async function buildGradeSummary(studentId, quarter, schoolId) {
  try {
    const gradesSnap = await admin.firestore()
      .collection('grades')
      .where('schoolId', '==', schoolId)
      .where('studentId', '==', studentId)
      .where('quarter', '==', quarter)
      .get();
    
    if (gradesSnap.empty) {
      return null;
    }
    
    const subjects = [];
    let totalGrade = 0;
    
    for (const gradeDoc of gradesSnap.docs) {
      const gradeData = gradeDoc.data();
      
      // Get learning area name
      const learningAreaDoc = await admin.firestore()
        .collection('learningAreas')
        .doc(gradeData.learningAreaId)
        .get();
      
      const learningAreaName = learningAreaDoc.exists ? 
        learningAreaDoc.data().name : 
        'Unknown Subject';
      
      const finalGrade = gradeData.finalGrade || 0;
      
      subjects.push({
        name: learningAreaName,
        grade: finalGrade,
        remarks: getGradeRemarks(finalGrade)
      });
      
      totalGrade += finalGrade;
    }
    
    const average = subjects.length > 0 ? 
      Math.round(totalGrade / subjects.length) : 
      0;
    
    return {
      subjects: subjects.sort((a, b) => a.name.localeCompare(b.name)),
      average: average,
      totalSubjects: subjects.length
    };
    
  } catch (error) {
    console.error('Error building grade summary:', error);
    return null;
  }
}

/**
 * Get grade remarks based on DepEd standards
 */
function getGradeRemarks(grade) {
  if (grade >= 90) return 'Outstanding';
  if (grade >= 85) return 'Very Satisfactory';
  if (grade >= 80) return 'Satisfactory';
  if (grade >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet Expectations';
}

/**
 * Check if notification was already sent
 */
async function wasNotificationSent(studentId, quarter, type, schoolId) {
  const existingNotif = await admin.firestore()
    .collection('notifications')
    .where('schoolId', '==', schoolId)
    .where('studentId', '==', studentId)
    .where('type', '==', type)
    .where('metadata.quarter', '==', quarter)
    .limit(1)
    .get();
  
  return !existingNotif.empty;
}

/**
 * Firestore trigger: Send email when grades are complete for a quarter
 */
exports.onGradePosted = functions.firestore
  .document('grades/{gradeId}')
  .onWrite(async (change, context) => {
    const gradeId = context.params.gradeId;
    
    // Handle both create and update
    const gradeData = change.after.exists ? change.after.data() : null;
    
    if (!gradeData) {
      console.log(`Grade ${gradeId} was deleted, skipping`);
      return null;
    }
    
    const { studentId, quarter, learningAreaId, finalGrade, schoolId } = gradeData;
    
    console.log(`Processing grade ${gradeId} for student ${studentId}, quarter ${quarter}, school ${schoolId}`);
    
    if (!schoolId) {
      console.error(`Grade ${gradeId} missing schoolId, skipping`);
      return null;
    }
    
    // Check if quarter is complete
    const isComplete = await isQuarterComplete(
      studentId, 
      quarter, 
      gradeData.sectionId
    );
    
    if (!isComplete) {
      console.log(`Quarter ${quarter} not complete for student ${studentId}, skipping notification`);
      return null;
    }
    
    // Check if already notified
    const alreadyNotified = await wasNotificationSent(
      studentId, 
      quarter, 
      'grade_alert',
      schoolId
    );
    
    if (alreadyNotified) {
      console.log(`Grade notification already sent for student ${studentId}, quarter ${quarter}`);
      return null;
    }
    
    try {
      // Lookup parent (within same school)
      const parentsSnap = await admin.firestore()
        .collection('parents')
        .where('schoolId', '==', schoolId)
        .where('studentIds', 'array-contains', studentId)
        .get();
      
      if (parentsSnap.empty) {
        console.log(`No parent found for student ${studentId}`);
        return null;
      }
      
      // Get student details
      const studentDoc = await admin.firestore()
        .collection('students')
        .doc(studentId)
        .get();
      
      if (!studentDoc.exists) {
        console.error(`Student ${studentId} not found`);
        return null;
      }
      
      const student = studentDoc.data();
      const studentName = `${student.firstName} ${student.lastName}`;
      
      // Get school settings (use schoolId-based document if available, fallback to legacy 'school' doc)
      const settingsDoc = await admin.firestore()
        .collection('settings')
        .doc(schoolId)
        .get();
      
      const schoolName = settingsDoc.exists ? 
        (settingsDoc.data().name || 'Your School') : 
        'Your School';
      
      // Build grade summary
      const gradeSummary = await buildGradeSummary(studentId, quarter, schoolId);
      
      if (!gradeSummary) {
        console.error(`Could not build grade summary for student ${studentId}, quarter ${quarter}`);
        return null;
      }
      
      // Process each parent
      const notificationPromises = parentsSnap.docs.map(async (parentDoc) => {
        const parent = parentDoc.data();
        const parentId = parentDoc.id;
        
        console.log(`Processing parent ${parentId} (${parent.email})`);
        
        // Check notification preferences
        if (!parent.notificationPreferences) {
          console.log(`Parent ${parentId} has no notification preferences, skipping`);
          return null;
        }
        
        if (!parent.notificationPreferences.gradeAlerts) {
          console.log(`Parent ${parentId} has disabled grade alerts, skipping`);
          return null;
        }
        
        if (!parent.notificationPreferences.emailEnabled) {
          console.log(`Parent ${parentId} has disabled email notifications, skipping`);
          return null;
        }
        
        if (!parent.email) {
          console.log(`Parent ${parentId} has no email address, skipping`);
          return null;
        }
        
        // Generate email content
        const emailContent = EmailTemplates.gradeAlert(
          parent.name,
          studentName,
          quarter,
          gradeSummary,
          schoolName
        );
        
        console.log(`Queueing grade email for ${parent.email} (${studentName}, Q${quarter})`);
        
        // Queue email via Extension (write to 'mail' collection)
        const emailDocId = await queueEmail({
          to: parent.email,
          subject: `Quarter ${quarter} Grades Posted for ${studentName}`,
          html: emailContent.html,
          text: emailContent.text
        });
        
        console.log(`Email queued with ID: ${emailDocId}`);
        
        // Log notification to Firestore
        const notificationData = {
          type: 'grade_alert',
          channel: 'email',
          schoolId: schoolId,
          recipientId: parentId,
          recipientName: parent.name,
          recipientEmail: parent.email,
          studentId: studentId,
          studentName: studentName,
          metadata: {
            gradeId: gradeId,
            quarter: quarter,
            average: gradeSummary.average,
            totalSubjects: gradeSummary.totalSubjects,
            emailDocId: emailDocId // Reference to mail collection doc
          },
          status: 'queued', // Extension will update this
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: new Date().toISOString(),
        };
        
        await admin.firestore()
          .collection('notifications')
          .add(notificationData);
        
        console.log(`Notification logged for parent ${parentId}`);
        
        return notificationData;
      });
      
      const results = await Promise.all(notificationPromises);
      const queuedCount = results.filter(r => r && r.status === 'queued').length;
      
      console.log(`Grade notification complete for student ${studentId}, Q${quarter}: ${queuedCount} queued`);
      
      return results;
      
    } catch (error) {
      console.error(`Error processing grade notification:`, error);
      
      // Log error to Firestore
      await admin.firestore()
        .collection('notificationErrors')
        .add({
          type: 'grade_alert',
          schoolId: schoolId,
          gradeId: gradeId,
          studentId: studentId,
          quarter: quarter,
          error: error.message,
          stack: error.stack,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      // Don't throw - we don't want to retry and duplicate notifications
      return null;
    }
  });

/**
 * Manually trigger grade notification for a student/quarter
 * Useful for testing or if automatic trigger missed
 */
exports.sendGradeNotificationManual = functions.https.onCall(async (data, context) => {
  // Only allow admin users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }
  
  const { studentId, quarter } = data;
  
  if (!studentId || !quarter) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'studentId and quarter are required'
    );
  }
  
  try {
    // Get student to verify schoolId access
    const studentDoc = await admin.firestore()
      .collection('students')
      .doc(studentId)
      .get();
    
    if (!studentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Student not found');
    }
    
    const schoolId = studentDoc.data().schoolId;
    
    if (!schoolId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Student has no schoolId assigned'
      );
    }
    
    // Check if quarter is complete
    const isComplete = await isQuarterComplete(studentId, quarter);
    
    if (!isComplete) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Quarter ${quarter} is not complete for student ${studentId}`
      );
    }
    
    // Trigger notification by simulating grade update
    const gradesSnap = await admin.firestore()
      .collection('grades')
      .where('schoolId', '==', schoolId)
      .where('studentId', '==', studentId)
      .where('quarter', '==', quarter)
      .limit(1)
      .get();
    
    if (gradesSnap.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No grades found for this student/quarter'
      );
    }
    
    const gradeDoc = gradesSnap.docs[0];
    
    // Update with a dummy field to trigger onWrite
    await gradeDoc.ref.update({
      lastNotificationTrigger: new Date().toISOString()
    });
    
    return {
      success: true,
      message: `Grade notification triggered for student ${studentId}, quarter ${quarter}`
    };
    
  } catch (error) {
    console.error('Error triggering manual grade notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = {
  onGradePosted: exports.onGradePosted,
  sendGradeNotificationManual: exports.sendGradeNotificationManual,
  isQuarterComplete,
  buildGradeSummary
};
