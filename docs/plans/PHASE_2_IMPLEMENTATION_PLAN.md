# 🚀 Parent Portal - Phase 2 Implementation Plan

**Start Date**: November 4, 2025  
**Target Completion**: November 11, 2025 (7 days)  
**Status**: 🟡 IN PROGRESS  
**Branch**: `feature/parent-portal-phase-2`

---

## 📊 Phase 2 Overview

Phase 2 focuses on **notification systems** and **enhanced security** to complete the critical parent portal features.

### Phase 2 Goals
1. ✅ **SMS/Email Notifications** - Real-time parent alerts
2. ✅ **Enhanced Security** - Password hashing + email verification
3. ✅ **Notification History** - Track all sent notifications
4. ⚠️ **Admin Notification Dashboard** - Monitor system health

### Completion Criteria
- [ ] Parents receive SMS when child is absent (within 5 minutes)
- [ ] Parents receive email when grades are posted
- [ ] Password authentication uses bcrypt hashing
- [ ] Email verification required for new accounts
- [ ] Notification delivery rate >95%
- [ ] All features tested with Playwright

---

## 🎯 Sprint 1: Notification System (Days 1-4)

### Day 1: Setup & Infrastructure ✅

**Tasks**:
- [x] Create feature branch: `feature/parent-portal-phase-2`
- [ ] Install dependencies: `@sendgrid/mail`, `bcryptjs`, `axios`
- [ ] Setup Semaphore.co API account (SMS provider for PH)
- [ ] Setup SendGrid API account (email provider)
- [ ] Configure environment variables for API keys
- [ ] Create Firestore collections schema

**Deliverables**:
- `functions/package.json` updated with new dependencies
- `.env.local` with API keys (add to .gitignore)
- Firestore collections: `notifications`, `notificationLogs`

---

### Day 2: SMS Absence Alerts

**Features to Implement**:
1. **Firestore Trigger** (`functions/src/notifications/onAbsenceCreated.js`)
   - Trigger on `attendanceRecords/{id}` create/update
   - Check if `status === 'A'` (Absent)
   - Lookup parent by `studentId`
   - Check parent notification preferences
   - Send SMS via Semaphore API
   - Log to `notifications` collection

2. **SMS Template**:
   ```
   EduSync Alert: Your child [Student Name] was marked ABSENT on [Date]. 
   Contact school for details: [School Phone]. Reply STOP to unsubscribe.
   ```

3. **Error Handling**:
   - Retry failed SMS (max 3 attempts)
   - Log delivery status
   - Alert admin if delivery fails

**Technical Requirements**:
```javascript
// functions/src/notifications/onAbsenceCreated.js
exports.onAbsenceCreated = functions.firestore
  .document('attendanceRecords/{recordId}')
  .onCreate(async (snap, context) => {
    const record = snap.data();
    if (record.status !== 'A') return null;
    
    // Lookup parent
    const parentSnap = await admin.firestore()
      .collection('parents')
      .where('studentIds', 'array-contains', record.studentId)
      .limit(1)
      .get();
    
    if (parentSnap.empty) return null;
    const parent = parentSnap.docs[0].data();
    
    // Check preferences
    if (!parent.notificationPreferences?.absenceAlerts) return null;
    if (!parent.notificationPreferences?.smsEnabled) return null;
    
    // Send SMS
    await sendSMS(parent.phone, buildAbsenceMessage(record));
    
    // Log notification
    await logNotification({
      type: 'absence_alert',
      channel: 'sms',
      recipientId: parentSnap.docs[0].id,
      studentId: record.studentId,
      status: 'sent',
      timestamp: new Date()
    });
  });
```

**Testing**:
- Unit tests for trigger logic
- Playwright test simulating absence creation
- SMS delivery verification (use test phone number)

---

### Day 3: Email Grade Alerts

**Features to Implement**:
1. **Firestore Trigger** (`functions/src/notifications/onGradePosted.js`)
   - Trigger on `grades/{id}` create/update
   - Check if quarter is complete (all subjects graded)
   - Lookup parent by `studentId`
   - Check notification preferences
   - Send email via SendGrid
   - Include grade summary table

2. **Email Template** (HTML + Plain text):
   ```html
   Subject: Quarter [X] Grades Posted for [Student Name]
   
   Dear [Parent Name],
   
   The grades for Quarter [X] have been posted for [Student Name].
   
   Grade Summary:
   - Mathematics: 88 (Good)
   - English: 92 (Excellent)
   - Science: 85 (Good)
   ...
   
   Overall Average: 88.5
   
   View full details: https://edusync-sis.web.app/grades
   
   Best regards,
   [School Name]
   ```

3. **Smart Trigger Logic**:
   - Only send once per quarter (prevent duplicate emails)
   - Batch processing if multiple subjects posted same time
   - Include grade trend (up/down from previous quarter)

**Technical Requirements**:
```javascript
// functions/src/notifications/onGradePosted.js
exports.onGradePosted = functions.firestore
  .document('grades/{gradeId}')
  .onWrite(async (change, context) => {
    const gradeData = change.after.exists ? change.after.data() : null;
    if (!gradeData) return null;
    
    // Check if quarter is complete
    const isComplete = await checkQuarterComplete(
      gradeData.studentId, 
      gradeData.quarter
    );
    
    if (!isComplete) return null;
    
    // Check if already notified
    const alreadyNotified = await checkNotificationSent(
      gradeData.studentId,
      gradeData.quarter,
      'grade_alert'
    );
    
    if (alreadyNotified) return null;
    
    // Lookup parent
    const parent = await getParentByStudentId(gradeData.studentId);
    if (!parent) return null;
    
    // Check preferences
    if (!parent.notificationPreferences?.gradeAlerts) return null;
    if (!parent.notificationPreferences?.emailEnabled) return null;
    
    // Build grade summary
    const gradeSummary = await buildGradeSummary(
      gradeData.studentId, 
      gradeData.quarter
    );
    
    // Send email
    await sendEmail({
      to: parent.email,
      subject: `Quarter ${gradeData.quarter} Grades Posted`,
      html: buildGradeEmailTemplate(parent, gradeSummary),
      text: buildGradeEmailPlainText(parent, gradeSummary)
    });
    
    // Log notification
    await logNotification({
      type: 'grade_alert',
      channel: 'email',
      recipientId: parent.id,
      studentId: gradeData.studentId,
      metadata: { quarter: gradeData.quarter },
      status: 'sent',
      timestamp: new Date()
    });
  });
```

**Testing**:
- Unit tests for quarter completion logic
- Playwright test simulating grade posting
- Email delivery verification (use test email)
- Duplicate prevention test

---

### Day 4: Announcement Notifications

**Features to Implement**:
1. **Firestore Trigger** (`functions/src/notifications/onAnnouncementCreated.js`)
   - Trigger on `announcements/{id}` create
   - Check if `target === 'parents'` or `target === 'all'`
   - Query all parent emails/phones
   - Batch send notifications (SMS + Email)
   - Rate limiting (max 100/minute)

2. **Notification Channels**:
   - **Email**: Full announcement with images
   - **SMS**: Short summary with link
   - **Push Notification**: If PWA installed (future)

3. **Priority Handling**:
   - 🔴 Emergency: Send immediately
   - 🟡 Important: Send within 1 hour
   - 🟢 Normal: Batch and send at 8 AM next day

**Technical Requirements**:
```javascript
// functions/src/notifications/onAnnouncementCreated.js
exports.onAnnouncementCreated = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    const announcement = snap.data();
    
    // Filter by target audience
    if (!['parents', 'all'].includes(announcement.target)) return null;
    
    // Get all parents with notification preferences enabled
    const parentsSnap = await admin.firestore()
      .collection('parents')
      .where('notificationPreferences.announcementAlerts', '==', true)
      .get();
    
    const parents = parentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Batch process notifications
    const batchSize = 100;
    for (let i = 0; i < parents.length; i += batchSize) {
      const batch = parents.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (parent) => {
        // Send email
        if (parent.notificationPreferences?.emailEnabled) {
          await sendEmail({
            to: parent.email,
            subject: announcement.title,
            html: buildAnnouncementEmailTemplate(announcement),
            text: announcement.content
          });
        }
        
        // Send SMS
        if (parent.notificationPreferences?.smsEnabled) {
          const smsMessage = buildAnnouncementSMSTemplate(announcement);
          await sendSMS(parent.phone, smsMessage);
        }
        
        // Log notification
        await logNotification({
          type: 'announcement_alert',
          channel: 'multi',
          recipientId: parent.id,
          metadata: { announcementId: snap.id },
          status: 'sent',
          timestamp: new Date()
        });
      }));
      
      // Rate limiting: wait 1 second between batches
      if (i + batchSize < parents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });
```

**Testing**:
- Batch processing test (100+ parents)
- Rate limiting verification
- Multi-channel delivery test
- Priority handling test

---

## 🔒 Sprint 2: Enhanced Security (Days 5-6)

### Day 5: Password Hashing

**Features to Implement**:
1. **Update Parent Registration** (`src/components/parent/ParentRegistration.tsx`)
   - Hash password before storing (bcrypt, cost=10)
   - Never store plaintext passwords

2. **Update Parent Login** (`components/LoginScreen.tsx`)
   - Compare hash instead of plaintext
   - Use `bcrypt.compare()`

3. **Migration Script** (`scripts/migrate-parent-passwords.cjs`)
   - Hash all existing plaintext passwords
   - Backup before migration
   - Verify all accounts after migration

4. **Update Seed Scripts**
   - All seed scripts use hashed passwords
   - Document password generation process

**Technical Requirements**:
```typescript
// Client-side (ParentRegistration.tsx)
// NO bcrypt on client - hash on server via Cloud Function

// Create new Cloud Function for registration
exports.registerParent = functions.https.onCall(async (data, context) => {
  const { email, password, name, studentId } = data;
  
  // Validate student verification code
  const student = await verifyStudent(studentId, data.verificationCode);
  if (!student) {
    throw new functions.https.HttpsError(
      'not-found',
      'Student not found or invalid verification code'
    );
  }
  
  // Check if email already exists
  const existingParent = await admin.firestore()
    .collection('parents')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (!existingParent.empty) {
    throw new functions.https.HttpsError(
      'already-exists',
      'Email already registered'
    );
  }
  
  // Hash password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create parent account
  const parentRef = await admin.firestore().collection('parents').add({
    name,
    email,
    password: hashedPassword,
    studentIds: [studentId],
    emailVerified: false,
    registrationDate: new Date().toISOString(),
    notificationPreferences: {
      emailEnabled: true,
      smsEnabled: false,
      absenceAlerts: true,
      gradeAlerts: true,
      announcementAlerts: true
    }
  });
  
  // Send verification email
  await sendVerificationEmail(email, parentRef.id);
  
  return { success: true, parentId: parentRef.id };
});

// Update login Cloud Function
exports.loginParent = functions.https.onCall(async (data, context) => {
  const { email, password } = data;
  
  const parentSnap = await admin.firestore()
    .collection('parents')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (parentSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'Invalid credentials');
  }
  
  const parent = parentSnap.docs[0].data();
  const bcrypt = require('bcryptjs');
  const isValid = await bcrypt.compare(password, parent.password);
  
  if (!isValid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid credentials');
  }
  
  // Return parent data (without password)
  const { password: _, ...parentData } = parent;
  return { 
    success: true, 
    parent: { id: parentSnap.docs[0].id, ...parentData }
  };
});
```

**Testing**:
- Password hashing unit tests
- Login with hashed password test
- Migration script verification
- Performance test (bcrypt timing)

---

### Day 6: Email Verification

**Features to Implement**:
1. **Verification Token Generation**
   - Generate secure random token (32 bytes)
   - Store in `emailVerificationTokens` collection
   - Set expiration (24 hours)

2. **Verification Email Template**:
   ```html
   Subject: Verify Your EduSync Account
   
   Dear [Parent Name],
   
   Welcome to EduSync! Please verify your email address by clicking the link below:
   
   https://edusync-sis.web.app/verify-email?token=[TOKEN]
   
   This link expires in 24 hours.
   
   If you didn't create this account, please ignore this email.
   
   Best regards,
   [School Name]
   ```

3. **Verification Endpoint** (`functions/src/auth/verifyEmail.js`)
   - Check token validity
   - Update parent `emailVerified: true`
   - Delete used token
   - Redirect to login with success message

4. **Login Enforcement**
   - Check `emailVerified` on login
   - Show "Verify your email" message if false
   - Provide "Resend verification" button

**Technical Requirements**:
```javascript
// functions/src/auth/verifyEmail.js
exports.verifyEmail = functions.https.onRequest(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send('Missing token');
  }
  
  // Lookup token
  const tokenSnap = await admin.firestore()
    .collection('emailVerificationTokens')
    .where('token', '==', token)
    .limit(1)
    .get();
  
  if (tokenSnap.empty) {
    return res.status(404).send('Invalid or expired token');
  }
  
  const tokenDoc = tokenSnap.docs[0];
  const tokenData = tokenDoc.data();
  
  // Check expiration
  const now = new Date();
  const expiration = new Date(tokenData.expiresAt);
  if (now > expiration) {
    await tokenDoc.ref.delete();
    return res.status(410).send('Token expired');
  }
  
  // Update parent
  await admin.firestore()
    .collection('parents')
    .doc(tokenData.parentId)
    .update({ emailVerified: true });
  
  // Delete token
  await tokenDoc.ref.delete();
  
  // Redirect to login with success message
  res.redirect('/?verified=true');
});

// Resend verification
exports.resendVerification = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  const parentSnap = await admin.firestore()
    .collection('parents')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (parentSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'Email not found');
  }
  
  const parent = parentSnap.docs[0];
  if (parent.data().emailVerified) {
    throw new functions.https.HttpsError('failed-precondition', 'Email already verified');
  }
  
  // Delete old tokens
  const oldTokens = await admin.firestore()
    .collection('emailVerificationTokens')
    .where('parentId', '==', parent.id)
    .get();
  
  await Promise.all(oldTokens.docs.map(doc => doc.ref.delete()));
  
  // Generate new token
  await sendVerificationEmail(parent.data().email, parent.id);
  
  return { success: true };
});
```

**Testing**:
- Token generation test
- Email verification flow test
- Expired token handling test
- Resend verification test

---

## 📈 Sprint 3: Notification History & Admin Dashboard (Day 7)

### Day 7: Notification History UI

**Features to Implement**:
1. **NotificationHistory Component** (`components/NotificationHistory.tsx`)
   - List all notifications sent to parent
   - Filter by type (SMS, Email, Multi)
   - Filter by status (Sent, Failed, Pending)
   - Show delivery timestamp
   - Resend failed notifications button

2. **Add to Parent Profile**
   - New tab: "Notification History"
   - Show last 50 notifications
   - Pagination for older notifications

3. **Admin Notification Dashboard** (`components/admin/NotificationDashboard.tsx`)
   - Total notifications sent (today/week/month)
   - Delivery success rate chart
   - Failed notifications list
   - Retry failed notifications (bulk)
   - SMS credit balance (Semaphore API)
   - Email quota usage (SendGrid)

**Technical Requirements**:
```typescript
// components/NotificationHistory.tsx
interface Notification {
  id: string;
  type: 'absence_alert' | 'grade_alert' | 'announcement_alert' | 'payment_reminder';
  channel: 'sms' | 'email' | 'multi';
  status: 'sent' | 'failed' | 'pending';
  timestamp: Date;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

const NotificationHistory: React.FC<{ parentId: string }> = ({ parentId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'sms' | 'email'>('all');
  
  useEffect(() => {
    const unsubscribe = db.collection('notifications')
      .where('recipientId', '==', parentId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(snap => {
        const notifs = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notifs);
      });
    
    return unsubscribe;
  }, [parentId]);
  
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.channel === filter);
  
  return (
    <div className="notification-history">
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('sms')}>SMS</button>
        <button onClick={() => setFilter('email')}>Email</button>
      </div>
      
      <div className="notification-list">
        {filteredNotifications.map(notif => (
          <div key={notif.id} className="notification-item">
            <div className="notification-type">
              {getNotificationIcon(notif.type)} {notif.type}
            </div>
            <div className="notification-channel">
              {notif.channel.toUpperCase()}
            </div>
            <div className="notification-status">
              {notif.status === 'sent' ? '✅' : '❌'} {notif.status}
            </div>
            <div className="notification-timestamp">
              {formatTimestamp(notif.timestamp)}
            </div>
            {notif.status === 'failed' && (
              <button onClick={() => resendNotification(notif.id)}>
                Resend
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Testing**:
- Notification list display test
- Filter functionality test
- Resend failed notification test
- Admin dashboard metrics test

---

## 📦 Deliverables Checklist

### Code Deliverables
- [ ] `functions/src/notifications/onAbsenceCreated.js` - SMS absence alerts
- [ ] `functions/src/notifications/onGradePosted.js` - Email grade alerts
- [ ] `functions/src/notifications/onAnnouncementCreated.js` - Multi-channel announcements
- [ ] `functions/src/auth/registerParent.js` - Secure registration with hashing
- [ ] `functions/src/auth/loginParent.js` - Secure login with bcrypt
- [ ] `functions/src/auth/verifyEmail.js` - Email verification endpoint
- [ ] `functions/src/utils/sendSMS.js` - Semaphore API integration
- [ ] `functions/src/utils/sendEmail.js` - SendGrid integration
- [ ] `components/NotificationHistory.tsx` - Parent notification history UI
- [ ] `components/admin/NotificationDashboard.tsx` - Admin monitoring dashboard
- [ ] `scripts/migrate-parent-passwords.cjs` - Password migration script

### Testing Deliverables
- [ ] `tests/notifications-absence-alert.spec.ts` - Absence alert E2E test
- [ ] `tests/notifications-grade-alert.spec.ts` - Grade alert E2E test
- [ ] `tests/notifications-announcement.spec.ts` - Announcement notification test
- [ ] `tests/security-password-hashing.spec.ts` - Password hashing test
- [ ] `tests/security-email-verification.spec.ts` - Email verification flow test
- [ ] `tests/notification-history.spec.ts` - Notification history UI test

### Documentation Deliverables
- [ ] `NOTIFICATION_SYSTEM_GUIDE.md` - Setup and usage guide
- [ ] `SECURITY_IMPLEMENTATION.md` - Security features documentation
- [ ] API documentation for Semaphore and SendGrid integration
- [ ] Update `FEATURE_ROADMAP.md` with Phase 2 completion

### Infrastructure Deliverables
- [ ] Semaphore.co account setup + API key
- [ ] SendGrid account setup + API key
- [ ] Firebase Functions deployment
- [ ] Firestore collections: `notifications`, `notificationLogs`, `emailVerificationTokens`
- [ ] Firestore security rules for new collections
- [ ] Environment variables configured (`.env.local`, Firebase Functions config)

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
- Notification trigger logic
- Password hashing/comparison
- Email verification token generation
- SMS/Email template rendering

### Integration Tests (Playwright)
- End-to-end absence alert flow
- End-to-end grade alert flow
- Registration with email verification
- Login with hashed passwords
- Notification history display

### Performance Tests
- Batch notification processing (100+ parents)
- Bcrypt hashing performance
- Firestore trigger latency
- SMS/Email delivery time

### Security Tests
- Password strength validation
- SQL injection attempts (N/A for Firestore)
- XSS prevention in email templates
- Token expiration enforcement
- Rate limiting verification

---

## 🚀 Deployment Plan

### Phase 2 Deployment Checklist
1. [ ] Run all Playwright tests locally (100% pass rate required)
2. [ ] Test on Firebase emulator (all features)
3. [ ] Deploy Firebase Functions to staging
4. [ ] Test with real SMS/Email (limited scope)
5. [ ] Run migration script on staging database
6. [ ] Verify password hashing on all accounts
7. [ ] Deploy to production
8. [ ] Monitor notification delivery rates
9. [ ] Monitor error logs (24 hours)
10. [ ] User acceptance testing with 5 parents

### Rollback Plan
If critical issues occur:
1. Revert Firebase Functions deployment
2. Disable notification triggers
3. Restore database from backup (if migration fails)
4. Fix issues on feature branch
5. Re-deploy with fixes

---

## 📊 Success Metrics

### Notification System
- **SMS Delivery Rate**: >95%
- **Email Delivery Rate**: >98%
- **Notification Latency**: <5 minutes
- **Failed Notification Rate**: <2%
- **Parent Engagement**: >60% open rate on emails

### Security
- **Password Strength**: All passwords meet complexity requirements
- **Email Verification Rate**: >80% within 24 hours
- **Bcrypt Performance**: <500ms per hash/compare
- **Zero** plaintext passwords in database

### User Experience
- **Notification Relevance**: >90% (parent feedback)
- **Opt-out Rate**: <5%
- **Support Tickets**: <10 notification-related issues/week

---

## 🔄 Post-Phase 2 Roadmap

After Phase 2 completion, consider:
1. **Push Notifications** (PWA) - Browser notifications
2. **Message Teachers** - Direct parent-teacher messaging
3. **Payment Reminders** - SMS/Email for fee reminders
4. **Report Card Download Alerts** - Notify when Form 138 ready
5. **Event Reminders** - Calendar-based notifications
6. **Multi-language Support** - Tagalog/English notifications

---

## 📞 Support Contacts

### API Providers
- **Semaphore**: support@semaphore.co
- **SendGrid**: https://support.sendgrid.com

### Development Team
- **Lead Developer**: [Your Name]
- **Firebase Admin**: [Admin Name]

---

**Last Updated**: November 4, 2025  
**Document Version**: 1.0
