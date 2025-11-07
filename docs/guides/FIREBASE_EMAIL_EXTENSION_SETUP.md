# 🔌 Firebase Email Extension Setup Guide

**Extension**: Trigger Email from Firestore (`firestore-send-email`)  
**Version**: 0.2.4  
**Status**: Recommended for Phase 2 (Hybrid Approach)

---

## 🎯 Why Use Firebase Extension for Email?

### ✅ Benefits:
- **No custom email code** - Extension handles everything
- **Built-in retry logic** - Automatic retries on failures
- **Queue management** - Handles batching automatically
- **Easy monitoring** - Firebase Console shows delivery status
- **Multiple providers** - Works with SendGrid, Gmail, custom SMTP
- **Template support** - Handlebars templates (optional)

### 📊 Hybrid Approach:
- ✅ **Email**: Firebase Extension (simpler)
- ✅ **SMS**: Custom Semaphore code (cheaper for PH: ₱2.50 vs ₱3-6 with Twilio)

---

## 📋 Installation Steps

### Option 1: Firebase Console (Easiest)

1. **Go to Firebase Console**:
   - Open: https://console.firebase.google.com
   - Select project: `edusync-sis`
   - Navigate to: **Build** → **Extensions**

2. **Install Extension**:
   - Click **Explore Extensions**
   - Search for: `Trigger Email from Firestore`
   - Click **Install**

3. **Configure Extension**:

   Fill in these settings during installation:

   ```
   Cloud Firestore path:
   mail
   
   SMTP connection URI (SendGrid):
   smtps://apikey@smtp.sendgrid.net:465
   
   SMTP password (SendGrid API Key):
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
   Email documents collection:
   mail
   
   Default FROM address:
   noreply@yourschool.com
   
   Default REPLY-TO address (optional):
   info@yourschool.com
   
   Users collection (optional):
   (leave empty)
   
   Templates collection (optional):
   (leave empty - we use inline HTML)
   ```

4. **Verify Installation**:
   - Extension status should show: **Active**
   - Cloud Function `ext-firestore-send-email-processQueue` should be deployed

---

### Option 2: Firebase CLI

```bash
# Install extension
firebase ext:install firebase/firestore-send-email --project=edusync-sis

# During installation, provide these answers:
# - Cloud Firestore path: mail
# - SMTP connection URI: smtps://apikey@smtp.sendgrid.net:465
# - SMTP password: <YOUR_SENDGRID_API_KEY>
# - Default FROM: noreply@yourschool.com
# - Default REPLY-TO: info@yourschool.com
```

---

## 🧪 Testing the Extension

### Step 1: Test Email Manually

Create a test document in Firestore:

```javascript
// In Firebase Console → Firestore → Add Document
// Collection: mail

{
  to: "your-email@gmail.com",
  message: {
    subject: "Test Email from EduSync",
    html: "<h1>Hello!</h1><p>This is a test email from the Firebase Extension.</p>",
    text: "Hello! This is a test email from the Firebase Extension."
  }
}
```

**Expected Result**:
- Extension detects new document
- Sends email via SendGrid SMTP
- Updates document with delivery status:
  ```javascript
  {
    to: "your-email@gmail.com",
    message: { ... },
    delivery: {
      state: "SUCCESS",
      startTime: "2025-11-04T...",
      endTime: "2025-11-04T...",
      info: {
        messageId: "...",
        accepted: ["your-email@gmail.com"]
      }
    }
  }
  ```

### Step 2: Check Function Logs

```bash
# View extension logs
firebase functions:log --only ext-firestore-send-email-processQueue

# Or in Firebase Console
# Go to: Functions → ext-firestore-send-email-processQueue → Logs
```

**Success Log**:
```
✅ Starting execution of extension with configuration
✅ Completed execution of extension
```

**Error Log** (if it fails):
```
❌ Error during email processing
Check SMTP credentials and connection
```

---

## 📧 How to Use in Code

### Grade Alert Example:

```javascript
// In onGradePosted function
const { queueEmail, EmailTemplates } = require('../utils/emailExtension');

// Generate email content
const emailContent = EmailTemplates.gradeAlert(
  parentName,
  studentName,
  quarter,
  gradeSummary,
  schoolName
);

// Queue email (Extension will send it)
const emailDocId = await queueEmail({
  to: parent.email,
  subject: `Quarter ${quarter} Grades Posted`,
  html: emailContent.html,
  text: emailContent.text
});

// Extension handles:
// - Sending email via SendGrid SMTP
// - Updating delivery status
// - Retrying on failures
```

### Announcement Example:

```javascript
// In onAnnouncementCreated function
const { queueBatchEmails, EmailTemplates } = require('../utils/emailExtension');

// Prepare emails for all parents
const emailRecipients = parents.map(p => {
  const emailContent = EmailTemplates.announcement(
    p.name,
    announcement,
    schoolName
  );
  
  return {
    to: p.email,
    subject: announcement.title,
    html: emailContent.html,
    text: emailContent.text
  };
});

// Queue all emails (Extension sends them)
const emailDocIds = await queueBatchEmails(emailRecipients);

console.log(`Queued ${emailDocIds.length} emails`);
```

---

## 🔍 Monitoring Email Delivery

### 1. Check Firestore `mail` Collection

Each email document will show delivery status:

```javascript
// SUCCESS
{
  to: "parent@example.com",
  delivery: {
    state: "SUCCESS",
    attempts: 1,
    endTime: "...",
    info: { messageId: "..." }
  }
}

// FAILED
{
  to: "parent@example.com",
  delivery: {
    state: "ERROR",
    attempts: 3,
    error: "Invalid recipient",
    endTime: "..."
  }
}

// PENDING (still processing)
{
  to: "parent@example.com",
  delivery: {
    state: "PENDING",
    attempts: 1,
    startTime: "..."
  }
}
```

### 2. Check SendGrid Dashboard

- Go to: https://app.sendgrid.com/email_activity
- View: Real-time delivery status
- Filter: By recipient, date, status

### 3. Query Failed Emails

```javascript
// Get all failed emails in the last 24 hours
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const failedEmails = await db.collection('mail')
  .where('delivery.state', '==', 'ERROR')
  .where('delivery.endTime', '>=', yesterday.toISOString())
  .get();

console.log(`Failed emails: ${failedEmails.size}`);
```

---

## 🐛 Troubleshooting

### Issue: Extension Not Sending Emails

**Check**:
1. ✅ Extension is installed and active
2. ✅ SMTP credentials are correct
3. ✅ SendGrid sender is verified
4. ✅ Document structure is correct
5. ✅ `mail` collection path matches extension config

**Debug**:
```bash
# Check extension status
firebase ext:list

# View extension logs
firebase functions:log --only ext-firestore-send-email-processQueue --limit 100
```

### Issue: Emails Marked as "PENDING" Forever

**Cause**: Extension function failed to process

**Solution**:
1. Check function logs for errors
2. Verify SMTP connection: `smtps://apikey@smtp.sendgrid.net:465`
3. Test SendGrid API key manually
4. Retry by updating document:
   ```javascript
   await db.collection('mail').doc(emailDocId).update({
     'delivery.state': 'PROCESSING'
   });
   ```

### Issue: "Invalid FROM address"

**Cause**: Sender email not verified in SendGrid

**Solution**:
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Verify sender email
3. Wait for verification email
4. Click verification link

### Issue: Extension Not Installed

**Symptom**: No `ext-firestore-send-email-processQueue` function

**Solution**:
```bash
# Reinstall extension
firebase ext:install firebase/firestore-send-email --project=edusync-sis

# Or use Firebase Console (easier)
```

---

## 💰 Cost Analysis

### SendGrid Pricing:
- **Free Tier**: 100 emails/day (3,000/month)
- **Essentials**: $15/month (40,000 emails)
- **Pro**: $60/month (150,000 emails)

### Extension Cost:
- **Firebase Functions**: Free tier (125K invocations/month)
- **Firestore**: Write operations charged per email
  - ~2 writes per email (create + update)
  - First 20K writes/day FREE
  
### Example Monthly Cost (100 parents, 10 emails/month):
- **Emails sent**: 100 × 10 = 1,000 emails
- **SendGrid**: FREE (under 3,000/month)
- **Firestore writes**: 2,000 writes = FREE (under 20K/day)
- **Functions**: 1,000 invocations = FREE
- **Total**: ₱0 📉

---

## 📊 Extension vs Custom Code Comparison

| Feature | Firebase Extension | Custom SendGrid Code |
|---------|-------------------|----------------------|
| Setup Time | ⚡ 5 minutes | ⏱️ 30 minutes |
| Code to Maintain | ✅ None | ❌ ~300 lines |
| Retry Logic | ✅ Built-in | ❌ Manual |
| Monitoring | ✅ Firestore docs | ❌ Custom logs |
| Error Handling | ✅ Automatic | ❌ Manual |
| Batch Processing | ✅ Automatic | ❌ Manual |
| Cost | 💰 Free tier | 💰 Free tier |
| Flexibility | ⚠️ Limited | ✅ Full control |

**Recommendation**: Use Extension for Phase 2 ✅

---

## 🚀 Next Steps

After extension is installed and tested:

1. **Update functions/.env**:
   ```bash
   # Only need Semaphore for SMS now
   SEMAPHORE_API_KEY=your_semaphore_key
   
   # Extension handles email (no SendGrid code needed)
   ```

2. **Deploy functions**:
   ```bash
   firebase deploy --only functions
   ```

3. **Test notifications**:
   - Absence alert (SMS only)
   - Grade alert (Email via Extension)
   - Announcement (SMS + Email)

4. **Monitor delivery**:
   - Check `mail` collection for email status
   - Check `notifications` collection for logs
   - View SendGrid dashboard for real-time tracking

---

**Last Updated**: November 4, 2025  
**Status**: ✅ Ready for installation
