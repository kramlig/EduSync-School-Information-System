# 🔧 Phase 2 Setup Guide - API Configuration

**Date**: November 4, 2025  
**Status**: Ready for API key configuration

---

## ✅ What's Been Built

### Notification Infrastructure (Complete)
- ✅ SMS service integration (Semaphore.co)
- ✅ Email service integration (SendGrid)
- ✅ Absence alert trigger (SMS when student absent)
- ✅ Grade alert trigger (Email when quarter complete)
- ✅ Announcement notifications (Multi-channel)
- ✅ Notification logging to Firestore
- ✅ Error handling and retry mechanisms

### Files Created
```
functions/
├── src/
│   ├── utils/
│   │   ├── sendSMS.js (250 lines) - Semaphore API integration
│   │   └── sendEmail.js (350 lines) - SendGrid integration
│   └── notifications/
│       ├── onAbsenceCreated.js (260 lines) - Absence alerts
│       ├── onGradePosted.js (450 lines) - Grade alerts
│       └── onAnnouncementCreated.js (350 lines) - Announcement alerts
└── .env (template created)
```

---

## 🔑 Step 1: Configure API Keys

### A. Get Semaphore API Key (SMS)

1. **Login to Semaphore**:
   - Go to: https://semaphore.co/dashboard
   - Login with your account credentials

2. **Find API Key**:
   - Navigate to: **Account** → **API Keys**
   - Copy your API key (format: `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

3. **Add to functions/.env**:
   ```bash
   # Open: functions/.env
   SEMAPHORE_API_KEY=your_actual_api_key_here
   ```

4. **Load Credits** (if needed):
   - Go to: **Account** → **Load Credits**
   - Minimum: ₱100 (~40-50 SMS)
   - Recommended: ₱500 for testing

### B. Get SendGrid API Key (Email)

1. **Login to SendGrid**:
   - Go to: https://app.sendgrid.com
   - Login with your account credentials

2. **Create API Key**:
   - Navigate to: **Settings** → **API Keys**
   - Click **Create API Key**
   - Name: `EduSync-Notifications`
   - Permissions: **Full Access** (or at least Mail Send)
   - Click **Create & View**
   - **IMPORTANT**: Copy the key immediately (you can't view it again!)

3. **Add to functions/.env**:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### C. Setup Verified Sender (SendGrid)

SendGrid requires verified sender emails:

1. **Go to Sender Authentication**:
   - Navigate to: **Settings** → **Sender Authentication**
   - Choose: **Single Sender Verification**

2. **Add Sender**:
   - From Name: `Your School Name`
   - From Email: `noreply@yourschool.com` (or use your Gmail)
   - Reply To: `info@yourschool.com` (optional)
   - Click **Create**

3. **Verify Email**:
   - Check your inbox for verification email
   - Click verification link
   - Wait for "Verified" status

4. **Add to functions/.env**:
   ```bash
   SENDGRID_FROM_EMAIL=noreply@yourschool.com
   ```

### D. Configure School Details

Add your school information to functions/.env:

```bash
SCHOOL_NAME=Your School Name
SCHOOL_PHONE=(XXX) XXX-XXXX
SCHOOL_WEBSITE=https://yourschool.com
```

---

## 🧪 Step 2: Test Locally (Emulator)

### A. Enable Test Mode

For testing without actually sending SMS/emails:

```bash
# In functions/.env
TEST_MODE=true
TEST_PHONE_NUMBER=+639171234567  # Your test number
TEST_EMAIL=your-email@gmail.com   # Your test email
```

### B. Start Firebase Emulator

```bash
# Terminal 1: Start emulator with functions
npm run dev:emu
```

This will start:
- Firestore emulator (port 8086)
- Functions emulator (port 5001)
- Vite dev server (port 5173)

### C. Test Absence Alert

1. **Open Firebase Emulator UI**:
   - Go to: http://localhost:4000/firestore
   - Navigate to `attendanceRecords` collection

2. **Create Test Absence**:
   - Click **Start Collection** (if empty)
   - Add document with auto-ID:
   ```json
   {
     "studentId": "student-id-from-emulator",
     "status": "A",
     "date": "2025-11-04",
     "sectionId": "section-id-from-emulator"
   }
   ```
   - Click **Save**

3. **Check Function Logs**:
   - Open terminal with emulator
   - Look for: `Processing attendance record...`
   - Look for: `Sending absence SMS to...`

4. **Verify Notification Logged**:
   - Check `notifications` collection in Firestore
   - Should see new document with:
     - `type: "absence_alert"`
     - `channel: "sms"`
     - `status: "sent"` or `"failed"`

### D. Test Grade Alert

1. **Prepare Test Data**:
   - Student with complete grades for Q1
   - Parent linked to that student
   - Parent has `notificationPreferences.gradeAlerts: true`

2. **Post Final Grade**:
   - Go to Firestore → `grades` collection
   - Update any grade document OR create new one
   - Trigger: `finalGrade` field update

3. **Check Function Logs**:
   - Look for: `Processing grade...`
   - Look for: `Quarter X completion for student...`
   - Look for: `Sending grade email to...`

4. **Verify Email Notification**:
   - Check `notifications` collection
   - Should see `type: "grade_alert"`, `channel: "email"`

### E. Test Announcement

1. **Create Announcement**:
   - Go to Firestore → `announcements` collection
   - Add document:
   ```json
   {
     "title": "Test Announcement",
     "content": "This is a test announcement",
     "target": "parents",
     "priority": "normal",
     "date": "2025-11-04T10:00:00Z"
   }
   ```

2. **Check Batch Processing**:
   - Function will query all parents
   - Send SMS to those with SMS enabled
   - Send email to those with email enabled

3. **Verify Stats Updated**:
   - Check announcement document
   - Should have `notificationStats` field added

---

## 🚀 Step 3: Deploy to Production

### A. Set Firebase Functions Config

For production, use Firebase config instead of .env:

```bash
# From project root
firebase functions:config:set \
  semaphore.api_key="YOUR_SEMAPHORE_KEY" \
  sendgrid.api_key="YOUR_SENDGRID_KEY" \
  sendgrid.from_email="noreply@yourschool.com" \
  school.name="Your School Name" \
  school.phone="(XXX) XXX-XXXX"
```

### B. Deploy Functions

```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

### C. Monitor Logs

```bash
# Watch real-time logs
firebase functions:log --only onAbsenceCreated,onGradePosted,onAnnouncementCreated

# Or use Firebase Console
# https://console.firebase.google.com → Functions → Logs
```

---

## 📊 Step 4: Verify Production

### Test Checklist

- [ ] **Absence Alert**:
  - Mark a student absent in production
  - Parent receives SMS within 5 minutes
  - Notification logged in Firestore

- [ ] **Grade Alert**:
  - Post complete quarter grades
  - Parent receives email with grade summary
  - Email has correct data and formatting

- [ ] **Announcement**:
  - Create announcement for parents
  - All parents receive SMS/Email (based on preferences)
  - Notification stats updated

- [ ] **Error Handling**:
  - Check `notificationErrors` collection for any errors
  - Verify retry functions work for failed notifications

---

## 🐛 Troubleshooting

### Issue: SMS Not Sending

**Check**:
1. ✅ Semaphore API key is correct
2. ✅ Phone number format (+639XXXXXXXXX)
3. ✅ Semaphore account has credits
4. ✅ Parent has `notificationPreferences.smsEnabled: true`
5. ✅ Parent has `notificationPreferences.absenceAlerts: true`

**Debug**:
```bash
# Check function logs
firebase functions:log --only onAbsenceCreated
```

### Issue: Email Not Sending

**Check**:
1. ✅ SendGrid API key is correct
2. ✅ Sender email is verified in SendGrid
3. ✅ Parent has `notificationPreferences.emailEnabled: true`
4. ✅ Parent has valid email address

**Debug**:
```bash
# Check SendGrid activity
# https://app.sendgrid.com/email_activity
```

### Issue: Function Not Triggering

**Check**:
1. ✅ Functions deployed successfully
2. ✅ Firestore trigger document path is correct
3. ✅ Function execution logs show trigger

**Debug**:
```bash
# List deployed functions
firebase functions:list

# Check specific function
firebase functions:log --only onAbsenceCreated --limit 50
```

### Issue: Notification Shows "Failed"

**Common Causes**:
- Invalid phone number format
- Invalid email address
- API rate limit exceeded
- Network timeout

**Solution**:
- Check `notifications` collection → `error` field
- Use retry functions from admin dashboard
- Check API provider status page

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Delivery Rates**:
   - SMS delivery: Target >95%
   - Email delivery: Target >98%
   
2. **Latency**:
   - Absence alert: <5 minutes from absence record
   - Grade alert: <10 minutes from grade post
   
3. **Costs**:
   - Semaphore: ~₱2.50 per SMS
   - SendGrid: Free tier (100 emails/day)

### Query Notification Stats

```javascript
// In Firebase console or script
const stats = await db.collection('notifications')
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .get();

const sent = stats.docs.filter(d => d.data().status === 'sent').length;
const failed = stats.docs.filter(d => d.data().status === 'failed').length;
const deliveryRate = (sent / stats.size) * 100;

console.log(`Delivery rate: ${deliveryRate.toFixed(2)}%`);
```

---

## 🎯 Next Steps

After API configuration and testing:

1. **Create Notification History UI** (NotificationHistory.tsx)
2. **Add Notification Preferences UI** (enhance ParentProfile.tsx)
3. **Implement Password Hashing** (security Phase 2)
4. **Add Email Verification** (security Phase 2)
5. **Create Playwright Tests** (automated testing)

---

## 📞 Support Resources

### API Documentation
- **Semaphore**: https://semaphore.co/docs
- **SendGrid**: https://docs.sendgrid.com

### Support Contacts
- **Semaphore**: support@semaphore.co
- **SendGrid**: https://support.sendgrid.com

### Cost Estimates
- **Semaphore**: ₱2.50/SMS (~400 SMS per ₱1,000)
- **SendGrid**: Free (100 emails/day), $15/month (40K emails)

---

**Last Updated**: November 4, 2025  
**Status**: ✅ Ready for API key configuration
