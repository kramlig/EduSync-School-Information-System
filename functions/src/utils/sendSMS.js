/**
 * SMS Notification Service using Semaphore.co API
 * 
 * Semaphore.co is a Philippine-based SMS provider with good local coverage.
 * API Documentation: https://semaphore.co/docs
 */

const axios = require('axios');
const functions = require('firebase-functions');

/**
 * Send SMS via Semaphore API
 * 
 * @param {string} phoneNumber - Philippine mobile number (format: 09171234567 or +639171234567)
 * @param {string} message - SMS message content (max 160 chars for single SMS)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Response from Semaphore API
 */
async function sendSMS(phoneNumber, message, options = {}) {
  // Get API key from environment or Firebase config
  const apiKey = process.env.SEMAPHORE_API_KEY || 
                 functions.config()?.semaphore?.api_key;
  
  if (!apiKey) {
    console.error('Semaphore API key not configured');
    throw new Error('SMS service not configured');
  }
  
  // Format phone number (ensure +63 format)
  const formattedPhone = formatPhilippineNumber(phoneNumber);
  
  // Validate message length
  if (message.length > 640) {
    console.warn(`SMS message truncated: ${message.length} chars -> 640 chars`);
    message = message.substring(0, 637) + '...';
  }
  
  try {
    const response = await axios.post(
      'https://api.semaphore.co/api/v4/messages',
      {
        apikey: apiKey,
        number: formattedPhone,
        message: message,
        sendername: options.sendername || 'EduSync',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );
    
    console.log(`SMS sent successfully to ${formattedPhone}:`, response.data);
    
    return {
      success: true,
      messageId: response.data[0]?.message_id,
      status: response.data[0]?.status,
      phoneNumber: formattedPhone,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`Failed to send SMS to ${formattedPhone}:`, error.message);
    
    // Parse Semaphore API error
    const errorMessage = error.response?.data?.message || error.message;
    const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
    
    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      phoneNumber: formattedPhone,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Format Philippine mobile number to +63 format
 * 
 * @param {string} phoneNumber - Input phone number
 * @returns {string} Formatted phone number (+639171234567)
 */
function formatPhilippineNumber(phoneNumber) {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('63')) {
    // Already has country code
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format (09171234567)
    return '+63' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    // Missing leading 0 (9171234567)
    return '+63' + cleaned;
  }
  
  // Invalid format - return as is with +63 prefix
  console.warn(`Unusual phone number format: ${phoneNumber}`);
  return '+63' + cleaned;
}

/**
 * Check Semaphore account balance
 * 
 * @returns {Promise<object>} Account balance and credit info
 */
async function checkSMSBalance() {
  const apiKey = process.env.SEMAPHORE_API_KEY || 
                 functions.config()?.semaphore?.api_key;
  
  if (!apiKey) {
    throw new Error('SMS service not configured');
  }
  
  try {
    const response = await axios.get(
      `https://api.semaphore.co/api/v4/account?apikey=${apiKey}`
    );
    
    return {
      success: true,
      balance: response.data.credit_balance,
      accountName: response.data.account_name,
      status: response.data.status,
    };
    
  } catch (error) {
    console.error('Failed to check SMS balance:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Batch send SMS to multiple recipients
 * 
 * @param {Array<{phone: string, message: string}>} recipients - Array of recipients
 * @param {object} options - Batch options
 * @returns {Promise<Array>} Array of send results
 */
async function sendBatchSMS(recipients, options = {}) {
  const batchSize = options.batchSize || 100;
  const delayMs = options.delayMs || 1000; // Delay between batches
  
  const results = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    console.log(`Sending SMS batch ${i / batchSize + 1} (${batch.length} messages)`);
    
    const batchResults = await Promise.allSettled(
      batch.map(recipient => sendSMS(recipient.phone, recipient.message, options))
    );
    
    results.push(...batchResults.map(r => r.value || r.reason));
    
    // Rate limiting: wait between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`Batch SMS complete: ${successCount} sent, ${failCount} failed`);
  
  return results;
}

/**
 * SMS Templates
 */
const SMSTemplates = {
  /**
   * Absence alert template
   */
  absenceAlert: (studentName, date, schoolPhone) => {
    return `EduSync Alert: ${studentName} was marked ABSENT on ${date}. Contact school for details: ${schoolPhone}. Reply STOP to unsubscribe.`;
  },
  
  /**
   * Announcement template
   */
  announcement: (title, link) => {
    return `EduSync: ${title}. View details: ${link}`;
  },
  
  /**
   * Payment reminder template
   */
  paymentReminder: (studentName, amount, dueDate) => {
    return `Reminder: ${studentName}'s payment of PHP ${amount} is due on ${dueDate}. Pay at school office. Reply STOP to unsubscribe.`;
  },
  
  /**
   * Emergency alert template
   */
  emergencyAlert: (message) => {
    return `⚠️ EMERGENCY ALERT: ${message}`;
  },
};

module.exports = {
  sendSMS,
  sendBatchSMS,
  checkSMSBalance,
  formatPhilippineNumber,
  SMSTemplates,
};
