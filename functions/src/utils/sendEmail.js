/**
 * Email Notification Service using SendGrid API
 * 
 * SendGrid is a reliable email delivery service with high deliverability rates.
 * API Documentation: https://docs.sendgrid.com/api-reference
 */

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
function initSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('SendGrid API key not configured');
    throw new Error('Email service not configured');
  }
  
  sgMail.setApiKey(apiKey);
}

/**
 * Send email via SendGrid
 * 
 * @param {object} emailData - Email configuration
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject line
 * @param {string} emailData.html - HTML email content
 * @param {string} emailData.text - Plain text email content (fallback)
 * @param {string} emailData.from - Sender email (optional)
 * @param {Array} emailData.attachments - Email attachments (optional)
 * @returns {Promise<object>} Send result
 */
async function sendEmail(emailData) {
  try {
    initSendGrid();
    
    const fromEmail = emailData.from || 
                      process.env.SENDGRID_FROM_EMAIL || 
                      'noreply@edusync.ph';
    
    const fromName = emailData.fromName || 'EduSync School System';
    
    const msg = {
      to: emailData.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      replyTo: emailData.replyTo || 'edusyncph@gmail.com',
      subject: emailData.subject,
      text: emailData.text || stripHtmlTags(emailData.html),
      html: emailData.html,
      attachments: emailData.attachments || [],
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    };
    
    const response = await sgMail.send(msg);
    
    console.log(`Email sent successfully to ${emailData.to}`);
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode,
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`Failed to send email to ${emailData.to}:`, error.message);
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR',
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Send batch emails to multiple recipients
 * 
 * @param {Array<object>} emails - Array of email configurations
 * @param {object} options - Batch options
 * @returns {Promise<Array>} Array of send results
 */
async function sendBatchEmails(emails, options = {}) {
  const batchSize = options.batchSize || 100;
  const delayMs = options.delayMs || 1000;
  
  const results = [];
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    console.log(`Sending email batch ${i / batchSize + 1} (${batch.length} emails)`);
    
    const batchResults = await Promise.allSettled(
      batch.map(email => sendEmail(email))
    );
    
    results.push(...batchResults.map(r => r.value || r.reason));
    
    // Rate limiting: wait between batches
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`Batch email complete: ${successCount} sent, ${failCount} failed`);
  
  return results;
}

/**
 * Strip HTML tags from string (for plain text fallback)
 */
function stripHtmlTags(html) {
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
 * Email Templates
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
          .button:hover { background: #5568d3; }
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
            <p><a href="https://edusync.ph/profile" style="color: #667eea;">
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
   * Email verification template
   */
  emailVerification: (parentName, verificationLink, schoolName) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; 
                     border-top: none; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 40px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #059669; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; 
                    border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email Address</h1>
          </div>
          
          <div class="content">
            <p>Dear ${parentName},</p>
            
            <p>Welcome to <strong>${schoolName}</strong> Parent Portal!</p>
            
            <p>Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">
                ${verificationLink}
              </a>
            </p>
            
            <p><strong>This link expires in 24 hours.</strong></p>
            
            <p>If you didn't create an account with EduSync, please ignore this email.</p>
            
            <p>Best regards,<br>
               <strong>${schoolName}</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EduSync School Information System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
Dear ${parentName},

Welcome to ${schoolName} Parent Portal!

Please verify your email address by clicking this link:
${verificationLink}

This link expires in 24 hours.

If you didn't create an account with EduSync, please ignore this email.

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
              <span class="priority-badge">${announcement.priority} PRIORITY</span>
              <span style="color: #6b7280; margin-left: 10px;">
                ${new Date(announcement.date).toLocaleDateString()}
              </span>
            </div>
            
            <div style="margin: 30px 0;">
              ${announcement.content}
            </div>
            
            ${announcement.link ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${announcement.link}" 
                   style="display: inline-block; background: #667eea; color: white; 
                          padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                  Learn More
                </a>
              </div>
            ` : ''}
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>${schoolName}</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EduSync School Information System</p>
            <p><a href="https://edusync.ph/profile" style="color: #667eea;">
               Update notification preferences
            </a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
${announcement.title}
${announcement.priority.toUpperCase()} PRIORITY - ${new Date(announcement.date).toLocaleDateString()}

Dear ${parentName},

${announcement.content.replace(/<[^>]*>/g, '')}

${announcement.link ? `Learn more: ${announcement.link}` : ''}

Best regards,
${schoolName}
    `.trim();
    
    return { html, text };
  },
};

module.exports = {
  sendEmail,
  sendBatchEmails,
  EmailTemplates,
  stripHtmlTags,
};
