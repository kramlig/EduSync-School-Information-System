/**
 * Helper Functions for Firebase Email Extension
 * 
 * These functions write to the 'mail' collection which is monitored by
 * the Firebase Trigger Email extension (firestore-send-email).
 * 
 * Extension automatically sends emails and updates delivery status.
 */

const admin = require('firebase-admin');

/**
 * Queue an email for sending via Firebase Extension
 * 
 * @param {object} emailData - Email configuration
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML email body
 * @param {string} emailData.text - Plain text email body (optional)
 * @param {string} emailData.from - Sender email (optional, uses default)
 * @param {string} emailData.replyTo - Reply-to email (optional)
 * @returns {Promise<string>} Document ID of queued email
 */
async function queueEmail(emailData) {
  try {
    const emailDoc = {
      to: emailData.to,
      message: {
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || stripHtmlTags(emailData.html)
      }
    };
    
    // Add optional fields
    if (emailData.from) {
      emailDoc.from = emailData.from;
    }
    
    if (emailData.replyTo) {
      emailDoc.replyTo = emailData.replyTo;
    }
    
    // Add to mail collection (extension watches this)
    const docRef = await admin.firestore()
      .collection('mail')
      .add(emailDoc);
    
    console.log(`Email queued for ${emailData.to}, doc ID: ${docRef.id}`);
    
    return docRef.id;
    
  } catch (error) {
    console.error('Error queueing email:', error);
    throw error;
  }
}

/**
 * Queue multiple emails for batch sending
 * 
 * @param {Array<object>} emails - Array of email configurations
 * @returns {Promise<Array<string>>} Array of document IDs
 */
async function queueBatchEmails(emails) {
  const promises = emails.map(email => queueEmail(email));
  return Promise.all(promises);
}

/**
 * Check email delivery status
 * 
 * @param {string} emailDocId - Document ID from queueEmail
 * @returns {Promise<object>} Delivery status
 */
async function checkEmailStatus(emailDocId) {
  const doc = await admin.firestore()
    .collection('mail')
    .doc(emailDocId)
    .get();
  
  if (!doc.exists) {
    return { state: 'NOT_FOUND' };
  }
  
  const data = doc.data();
  
  return {
    state: data.delivery?.state || 'PENDING',
    startTime: data.delivery?.startTime,
    endTime: data.delivery?.endTime,
    error: data.delivery?.error,
    info: data.delivery?.info
  };
}

/**
 * Strip HTML tags from string (for plain text fallback)
 */
function stripHtmlTags(html) {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Email Templates (same as before, reused)
 */
const EmailTemplates = {
  /**
   * Grade alert email template
   */
  gradeAlert: (parentName, studentName, quarter, gradeSummary, schoolName) => {
    const averageGrade = gradeSummary.average;
    const gradeColor = averageGrade >= 90 ? '#10b981' : 
                       averageGrade >= 85 ? '#3b82f6' : 
                       averageGrade >= 75 ? '#f59e0b' : '#ef4444';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quarter ${quarter} Grades Posted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; 
                     border-top: none; border-radius: 0 0 10px 10px; }
          .grade-summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .grade-item { display: flex; justify-content: space-between; padding: 10px 0; 
                        border-bottom: 1px solid #d1d5db; }
          .grade-item:last-child { border-bottom: none; }
          .average { font-size: 48px; font-weight: bold; color: ${gradeColor}; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; 
                    border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Quarter ${quarter} Grades Posted</h1>
          </div>
          
          <div class="content">
            <p>Dear ${parentName},</p>
            
            <p>The grades for <strong>Quarter ${quarter}</strong> have been posted for 
               <strong>${studentName}</strong>.</p>
            
            <div class="grade-summary">
              <h3 style="margin-top: 0;">Grade Summary</h3>
              ${gradeSummary.subjects.map(subject => `
                <div class="grade-item">
                  <span>${subject.name}</span>
                  <strong>${subject.grade}</strong>
                </div>
              `).join('')}
            </div>
            
            <div class="average">
              ${averageGrade}
            </div>
            <p style="text-align: center; color: #6b7280;">Overall Average</p>
            
            <div style="text-align: center;">
              <a href="https://edusync.ph/grades" class="button">
                View Full Report Card
              </a>
            </div>
            
            <p style="margin-top: 30px;">
              ${averageGrade >= 90 ? '🌟 Excellent work! Your child is performing exceptionally well.' :
                averageGrade >= 85 ? '👍 Great job! Your child is doing very well.' :
                averageGrade >= 75 ? '📚 Keep it up! Consistent effort will lead to improvement.' :
                '⚠️ Additional support may be needed. Please contact the teacher to discuss.'}
            </p>
            
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
               <strong>${schoolName}</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EduSync School Information System</p>
            <p>You are receiving this because you have enabled grade alert notifications</p>
            <p><a href="https://edusync-sis.web.app/profile" style="color: #667eea;">
               Update notification preferences
            </a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
Dear ${parentName},

The grades for Quarter ${quarter} have been posted for ${studentName}.

Grade Summary:
${gradeSummary.subjects.map(s => `- ${s.name}: ${s.grade}`).join('\n')}

Overall Average: ${averageGrade}

View full report card: https://edusync.ph/grades

Best regards,
${schoolName}
    `.trim();
    
    return { html, text };
  },
  
  /**
   * Announcement email template
   */
  announcement: (parentName, announcement, schoolName) => {
    const priorityColor = announcement.priority === 'high' ? '#ef4444' :
                          announcement.priority === 'medium' ? '#f59e0b' : '#3b82f6';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${announcement.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${priorityColor}; color: white; padding: 30px; 
                    text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; 
                     border-top: none; border-radius: 0 0 10px 10px; }
          .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; 
                           font-size: 12px; font-weight: bold; text-transform: uppercase; 
                           background: ${priorityColor}; color: white; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; 
                    border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ${announcement.title}</h1>
          </div>
          
          <div class="content">
            <p>Dear ${parentName},</p>
            
            <div style="margin: 20px 0;">
              <span class="priority-badge">${announcement.priority || 'normal'} PRIORITY</span>
              <span style="color: #6b7280; margin-left: 10px;">
                ${new Date(announcement.date).toLocaleDateString()}
              </span>
            </div>
            
            <div style="margin: 30px 0;">
              ${announcement.content}
            </div>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>${schoolName}</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EduSync School Information System</p>
            <p><a href="https://edusync-sis.web.app/profile" style="color: #667eea;">
               Update notification preferences
            </a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
${announcement.title}
${(announcement.priority || 'normal').toUpperCase()} PRIORITY - ${new Date(announcement.date).toLocaleDateString()}

Dear ${parentName},

${announcement.content.replace(/<[^>]*>/g, '')}

Best regards,
${schoolName}
    `.trim();
    
    return { html, text };
  },
  
  /**
   * Absence alert email template
   */
  absenceAlert: (parentName, studentName, date, reason, schoolName, schoolPhone) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Absence Alert - ${studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .alert-icon { font-size: 48px; margin-bottom: 10px; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; 
                     border-top: none; border-radius: 0 0 10px 10px; }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; 
                      padding: 15px; margin: 20px 0; border-radius: 4px; }
          .student-name { font-size: 20px; font-weight: bold; color: #ea580c; }
          .date-badge { display: inline-block; background: #fef3c7; color: #92400e; 
                       padding: 8px 16px; border-radius: 6px; font-weight: bold; margin: 15px 0; }
          .action-box { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; 
                    border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">⚠️</div>
            <h1>Absence Alert</h1>
            <p style="margin: 0; font-size: 16px;">Student Attendance Notification</p>
          </div>
          
          <div class="content">
            <p>Dear ${parentName},</p>
            
            <div class="info-box">
              <p style="margin: 0; font-size: 16px;">
                <strong>This is to inform you that:</strong>
              </p>
              <p class="student-name" style="margin: 10px 0 0 0;">${studentName}</p>
              <p style="margin: 5px 0 0 0;">was marked <strong>ABSENT</strong> from school</p>
            </div>
            
            <div class="date-badge">
              📅 ${formattedDate}
            </div>
            
            ${reason ? `
            <div style="margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">REASON PROVIDED:</p>
              <p style="margin: 5px 0 0 0; font-style: italic;">"${reason}"</p>
            </div>
            ` : ''}
            
            <div class="action-box">
              <h3 style="margin-top: 0; color: #1f2937;">What You Should Do:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>If you are aware of this absence, no action is needed</li>
                <li>If this absence is unexpected, please contact the school immediately</li>
                <li>For excused absences, please submit proper documentation</li>
                <li>Review your child's attendance record regularly</li>
              </ul>
            </div>
            
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>📞 Need to contact us?</strong><br>
                School Office: ${schoolPhone || '(XXX) XXX-XXXX'}<br>
                Office Hours: Monday - Friday, 7:00 AM - 4:00 PM
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              Thank you for your attention to this matter. Regular attendance is crucial for your child's academic success.
            </p>
            
            <p>
              Best regards,<br>
              <strong>${schoolName}</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated attendance notification from EduSync School Information System</p>
            <p><a href="https://edusync-sis.web.app/attendance" style="color: #667eea;">
               View Full Attendance Record
            </a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
ABSENCE ALERT - ${studentName}

Dear ${parentName},

This is to inform you that ${studentName} was marked ABSENT from school on ${formattedDate}.

${reason ? `Reason provided: "${reason}"` : ''}

What You Should Do:
- If you are aware of this absence, no action is needed
- If this absence is unexpected, please contact the school immediately
- For excused absences, please submit proper documentation
- Review your child's attendance record regularly

Need to contact us?
School Office: ${schoolPhone || '(XXX) XXX-XXXX'}
Office Hours: Monday - Friday, 7:00 AM - 4:00 PM

Thank you for your attention to this matter. Regular attendance is crucial for your child's academic success.

Best regards,
${schoolName}

View attendance record: https://edusync-sis.web.app/attendance
    `.trim();
    
    return { html, text };
  }
};

module.exports = {
  queueEmail,
  queueBatchEmails,
  checkEmailStatus,
  EmailTemplates,
  stripHtmlTags
};
