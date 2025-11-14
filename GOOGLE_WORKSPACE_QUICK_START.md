# 🚀 Google Workspace Quick Start

**Your Domain:** edusync.ph  
**Trial Expires:** Dec 07, 2025  
**Admin Console:** https://admin.google.com

---

## ⚡ Immediate Next Steps (30 minutes)

### 1. Create Email Accounts in Google Workspace

**Go to:** https://admin.google.com → Users → Add new user

**Create these 2 essential accounts first:**

✉️ **official@edusync.ph**
- Purpose: Main system notifications
- Use for: All automated emails from EduSync

✉️ **hello@edusync.ph**
- Purpose: Customer inquiries  
- Use for: Trial signups, contact form

---

### 2. Authenticate Domain in SendGrid

**Go to:** https://app.sendgrid.com/settings/sender_auth/domains

**Steps:**
1. Click "Authenticate Your Domain"
2. Enter: `edusync.ph`
3. Copy the 3 CNAME records SendGrid provides
4. Add them to your domain's DNS settings
5. Wait 5-10 minutes
6. Click "Verify" in SendGrid

**Why?** This prevents your emails from going to spam.

---

### 3. Create Verified Sender in SendGrid

**Go to:** https://app.sendgrid.com/settings/sender_auth/senders

**Steps:**
1. Click "Create New Sender"
2. Fill in:
   - From Email: `official@edusync.ph`
   - Reply To: `official@edusync.ph`
   - From Name: EduSync
3. Click "Create"
4. Check `official@edusync.ph` inbox in Google Workspace
5. Click verification link

---

### 4. Test Email Sending

**Run this command:**
```bash
cd functions
node test-email-extension.js
```

**Expected:** Email sent from `official@edusync.ph`

---

## 📋 DNS Records Checklist

Add these to your domain registrar:

### SendGrid Authentication (from Step 2)
- [ ] CNAME: `em1234.edusync.ph` → [SendGrid provides]
- [ ] CNAME: `s1._domainkey.edusync.ph` → [SendGrid provides]
- [ ] CNAME: `s2._domainkey.edusync.ph` → [SendGrid provides]

### Optional: SPF Record (prevents spam)
- [ ] TXT: `@` → `v=spf1 include:sendgrid.net ~all`

---

## 🎯 Priority Order

### This Week (Before launching)
1. ✅ Create `official@edusync.ph` 
2. ✅ Create `hello@edusync.ph`
3. ✅ Authenticate domain in SendGrid
4. ✅ Create verified sender
5. ✅ Test email sending

### Next Week (After testing)
6. ⬜ Create `noreply@edusync.ph`
7. ⬜ Create `support@edusync.ph`
8. ⬜ Deploy Firebase Functions with new email
9. ⬜ Monitor email deliverability

### Before Dec 07, 2025 (Trial expires)
10. ⬜ Decide: Keep Google Workspace or switch to email forwarding
11. ⬜ Update payment if keeping
12. ⬜ Backup emails if canceling

---

## 🔗 Important Links

| Service | URL | Purpose |
|---------|-----|---------|
| Google Admin Console | https://admin.google.com | Manage email accounts |
| SendGrid Dashboard | https://app.sendgrid.com | Monitor email delivery |
| SendGrid Domain Auth | https://app.sendgrid.com/settings/sender_auth/domains | Authenticate domain |
| SendGrid Senders | https://app.sendgrid.com/settings/sender_auth/senders | Verify sender emails |
| Email Activity | https://app.sendgrid.com/email_activity | Track sent emails |

---

## 💡 Tips

**Email Best Practices:**
- Use `official@edusync.ph` for important system emails
- Use `noreply@edusync.ph` for automated notifications
- Use `hello@edusync.ph` for customer communication
- Monitor spam reports in SendGrid dashboard

**Cost Saving:**
- Google Workspace Trial is FREE until Dec 07, 2025
- SendGrid Free Tier: 100 emails/day (sufficient for testing)
- After trial: Consider email forwarding (FREE) vs Google Workspace (₱336/mo)

---

## ❓ Questions?

See full guide: `docs/GOOGLE_WORKSPACE_SETUP.md`

**Quick Command Reference:**
```bash
# Test email sending
cd functions && node test-email-extension.js

# Deploy functions with new email
firebase deploy --only functions --project edusync-sis

# Check function logs
firebase functions:log --project edusync-sis
```

---

**Last Updated:** November 11, 2025  
**Status:** ⏳ Setup in progress
