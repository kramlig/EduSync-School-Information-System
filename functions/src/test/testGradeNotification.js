/**
 * Test Grade Notification - HTTP Cloud Function
 * 
 * This creates test data and triggers a grade notification email
 * to verify the grade alert system is working.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { queueEmail, EmailTemplates } = require('../utils/emailExtension');

exports.testGradeNotification = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🧪 Testing Grade Notification System...');

    const db = admin.firestore();
    
    // Test data
    const testStudent = {
      id: 'test-student-001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      grade: '7'
    };
    
    const testParent = {
      email: 'kramlig.dotillos@gmail.com',
      firstName: 'Maria',
      lastName: 'Dela Cruz',
      notificationPreferences: {
        emailEnabled: true,
        gradeAlerts: true
      }
    };
    
    const testGrades = [
      { subject: 'Mathematics', finalGrade: 92, remarks: 'Passed' },
      { subject: 'Science', finalGrade: 88, remarks: 'Passed' },
      { subject: 'English', finalGrade: 90, remarks: 'Passed' },
      { subject: 'Filipino', finalGrade: 85, remarks: 'Passed' },
      { subject: 'PE', finalGrade: 95, remarks: 'Passed' }
    ];
    
    const quarter = 1;
    const schoolName = 'EduSync School';
    
    // Build grade summary
    let gradeSummaryHtml = '';
    let gradeSummaryText = '';
    let totalGrade = 0;
    
    testGrades.forEach(grade => {
      gradeSummaryHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${grade.subject}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #059669;">${grade.finalGrade}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${grade.remarks}</td>
        </tr>
      `;
      
      gradeSummaryText += `${grade.subject}: ${grade.finalGrade} (${grade.remarks})\n`;
      totalGrade += grade.finalGrade;
    });
    
    const generalAverage = (totalGrade / testGrades.length).toFixed(2);
    
    gradeSummaryHtml += `
      <tr style="background-color: #F3F4F6; font-weight: bold;">
        <td style="padding: 10px;">General Average</td>
        <td style="padding: 10px; color: #059669;">${generalAverage}</td>
        <td style="padding: 10px;">-</td>
      </tr>
    `;
    
    gradeSummaryText += `\nGeneral Average: ${generalAverage}`;
    
    // Build grade summary object for template
    const gradeSummaryData = {
      subjects: testGrades.map(g => ({
        name: g.subject,
        grade: g.finalGrade
      })),
      average: parseFloat(generalAverage)
    };
    
    // Generate email using template
    const emailContent = EmailTemplates.gradeAlert(
      testParent.firstName,
      `${testStudent.firstName} ${testStudent.lastName}`,
      quarter,
      gradeSummaryData,
      schoolName
    );
    
    // Queue email via Firebase Extension
    const emailDocId = await queueEmail({
      to: testParent.email,
      subject: `📊 Grade Report - Quarter ${quarter} for ${testStudent.firstName}`,
      html: emailContent.html,
      text: emailContent.text
    });
    
    console.log(`✅ Grade notification email queued: ${emailDocId}`);
    
    // Log to notifications collection (simulating what the real function does)
    const notificationRef = await db.collection('notifications').add({
      type: 'grade_alert',
      channel: 'email',
      studentId: testStudent.id,
      studentName: `${testStudent.firstName} ${testStudent.lastName}`,
      parentEmail: testParent.email,
      quarter: quarter,
      status: 'queued',
      metadata: {
        emailDocId: emailDocId,
        generalAverage: generalAverage,
        subjectCount: testGrades.length
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Notification logged: ${notificationRef.id}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Grade notification test email sent!',
      data: {
        student: `${testStudent.firstName} ${testStudent.lastName}`,
        quarter: quarter,
        generalAverage: generalAverage,
        subjectCount: testGrades.length,
        parentEmail: testParent.email,
        emailDocId: emailDocId,
        notificationId: notificationRef.id
      },
      checkEmail: {
        inbox: testParent.email,
        subject: `📊 Grade Report - Quarter ${quarter} for ${testStudent.firstName}`
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
        'Check emailExtension.js is properly configured',
        'Verify Firebase Extension is active',
        'Check parent email is valid',
        'Review Cloud Functions logs for details'
      ]
    });
  }
});
