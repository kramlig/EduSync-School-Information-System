# Google Workspace Setup Guide for EduSync
## Domain: edusync.ph

**Status:** ✅ Google Workspace Activated (Nov 10, 2025)  
**Plan:** Business Starter (Trial)  
**Expires:** Dec 07, 2025

---

## 📋 Step-by-Step Setup Checklist

### ✅ COMPLETED
- [x] Google Workspace account activated
- [x] Domain `edusync.ph` verified
- [x] Primary administrator account created

### 🔄 IN PROGRESS

#### Step 1: Create Professional Email Accounts (15 minutes)

Create these email accounts in Google Workspace:

1. **Go to Google Workspace Admin Console:**
   - URL: https://admin.google.com
   - Sign in with your admin account

2. **Create Users:**

   **Click: Users → Add new user**

   | Email | Purpose | Priority |
   |-------|---------|----------|
   | `official@edusync.ph` | Main system notifications | HIGH |
   | `noreply@edusync.ph` | Automated emails (grades, attendance) | HIGH |
   | `hello@edusync.ph` | Customer inquiries | MEDIUM |
   | `support@edusync.ph` | Technical support | MEDIUM |
   | `dev@edusync.ph` | Developer notifications | LOW |

3. **Set Strong Passwords:**
   - Use a password manager (e.g., LastPass, 1Password)
   - Minimum 16 characters
   - Save credentials securely

---

#### Step 2: Configure SendGrid Domain Authentication (30 minutes)

Even with Google Workspace, SendGrid ensures high email deliverability rates.

##### 2.1 Authenticate Domain

1. **Go to SendGrid:**
   - URL: https://app.sendgrid.com/settings/sender_auth/domains
   - Sign in with your account

2. **Authenticate Your Domain:**
   - Click **"Authenticate Your Domain"**
   - Select **"Use my own DNS provider"**
   - Enter domain: `edusync.ph`
   - Click **"Next"**

3. **SendGrid will provide 3 DNS records** (example):

   ```
   Type: CNAME
   Name: em1234.edusync.ph
   Value: u12345.wl123.sendgrid.net
   TTL: 3600

   Type: CNAME
   Name: s1._domainkey.edusync.ph
   Value: s1.domainkey.u12345.wl123.sendgrid.net
   TTL: 3600

   Type: CNAME
   Name: s2._domainkey.edusync.ph
   Value: s2.domainkey.u12345.wl123.sendgrid.net
   TTL: 3600
   ```

##### 2.2 Add DNS Records to Your Domain

**Where:** Your domain registrar (where you bought `edusync.ph`)

**Steps:**
1. Log in to your domain registrar (e.g., Google Domains, Namecheap, GoDaddy)
2. Navigate to **DNS Settings** or **DNS Management**
3. Add all 3 CNAME records provided by SendGrid
4. Save changes

**Wait 5-30 minutes for DNS propagation**

##### 2.3 Verify in SendGrid

1. Return to SendGrid domain authentication page
2. Click **"Verify"**
3. ✅ Should show "Verified" status

---

#### Step 3: Create Verified Sender in SendGrid (10 minutes)

1. **Go to Sender Authentication:**
   - URL: https://app.sendgrid.com/settings/sender_auth/senders

2. **Click "Create New Sender"**

3. **Fill in Details:**
   ```
   From Name: EduSync
   From Email Address: official@edusync.ph
   Reply To: official@edusync.ph
   Company Name: EduSync
   Address: [Your office address]
   City: [Your city]
   Country: Philippines
   ```

4. **Click "Create"**

5. **Verify Email:**
   - Check inbox: `official@edusync.ph` (in Google Workspace)
   - Click verification link in email

---

#### Step 4: Update Firebase Configuration (5 minutes)

**File:** `functions/.env`

Already updated to:
```env
SENDGRID_FROM_EMAIL=official@edusync.ph
```

**Next:** Update other default email references

---

#### Step 5: Update Default Email References (10 minutes)

Update these files to use your new professional email:

##### File: `functions/src/utils/sendEmail.js`

Find and replace:
```javascript
// OLD
'noreply@edusync-sis.web.app'

// NEW
'noreply@edusync.ph'
```

##### File: `functions/src/trialSignup.js`

Already correct:
```javascript
to: 'hello@edusync.ph'
```

---

#### Step 6: Configure Google Workspace MX Records (OPTIONAL)

If you want to receive emails directly to Google Workspace mailboxes:

1. **Go to Google Admin Console:**
   - Navigate to: **Apps → Google Workspace → Gmail → Advanced settings**

2. **Get MX Records:**
   - Google will provide MX records

3. **Add to Domain DNS:**
   - Priority 1: `aspmx.l.google.com`
   - Priority 5: `alt1.aspmx.l.google.com`
   - Priority 5: `alt2.aspmx.l.google.com`
   - Priority 10: `alt3.aspmx.l.google.com`
   - Priority 10: `alt4.aspmx.l.google.com`

---

#### Step 7: Test Email Sending (15 minutes)

##### Test 1: SendGrid Direct

```bash
cd functions
node test-email-extension.js
```

- Should send to test email
- Check delivery status in SendGrid: https://app.sendgrid.com/email_activity

##### Test 2: Trial Signup Flow

1. Go to: https://edusync.ph (or your Firebase Hosting URL)
2. Click **"Start Free Trial"**
3. Fill out form with test data
4. Submit

**Expected Results:**
- Email to `hello@edusync.ph` with lead details
- Email FROM: `official@edusync.ph`
- Email arrives in Google Workspace inbox

##### Test 3: Parent Notification (Production)

After deployment, test with a real parent account:

1. Create test parent: `testparent@gmail.com`
2. Mark attendance absence for their child
3. Check if parent receives email FROM: `noreply@edusync.ph`

---

#### Step 8: Deploy Updated Functions (5 minutes)

```bash
# Deploy to production
firebase deploy --only functions --project edusync-sis

# Or deploy specific functions
firebase deploy --only functions:trialSignup,functions:onAbsenceCreated --project edusync-sis
```

---

#### Step 9: Monitor Email Deliverability (Ongoing)

**SendGrid Activity Dashboard:**
- URL: https://app.sendgrid.com/email_activity
- Monitor: Opens, Clicks, Bounces, Spam reports

**Google Workspace Admin Console:**
- URL: https://admin.google.com
- Check: Email routing, security settings

---

## 🔧 Advanced Configuration

### Email Aliases (Optional)

Create email aliases in Google Workspace for flexibility:

```
noreply@edusync.ph → official@edusync.ph
no-reply@edusync.ph → official@edusync.ph
admin@edusync.ph → official@edusync.ph
```

**How to:**
1. Google Admin Console → **Users**
2. Click on `official@edusync.ph`
3. **User information → Email aliases**
4. Add aliases

### Email Forwarding Rules

**Forward trial inquiries to your personal Gmail:**

1. Sign in to `hello@edusync.ph`
2. **Settings → Forwarding and POP/IMAP**
3. Add forwarding address: `kramlig.dotillos@gmail.com`
4. Verify forwarding

---

## 🐛 Troubleshooting

### Issue: Emails Not Sending from `official@edusync.ph`

**Check:**
1. ✅ Sender verified in SendGrid
2. ✅ Domain authenticated in SendGrid (green checkmark)
3. ✅ DNS CNAME records added correctly
4. ✅ `SENDGRID_FROM_EMAIL` updated in `functions/.env`

**Debug:**
```bash
# Check SendGrid logs
# https://app.sendgrid.com/email_activity

# Check Firebase Functions logs
firebase functions:log --project edusync-sis
```

### Issue: Emails Going to Spam

**Solutions:**
1. Warm up your domain (send gradually increasing volumes)
2. Add SPF record to DNS:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:sendgrid.net ~all
   ```
3. Monitor spam reports in SendGrid

### Issue: Google Workspace Trial Expiring

**Before Dec 07, 2025:**
- Convert to paid subscription (₱336/month per user)
- Or migrate to alternative email hosting
- Backup important emails

---

## 📊 Cost Breakdown

### Current Setup

| Service | Plan | Cost | Status |
|---------|------|------|--------|
| Google Workspace | Business Starter (Trial) | FREE → ₱336/mo | Active until Dec 07 |
| SendGrid | Free Tier | FREE (100 emails/day) | Active |
| Domain (edusync.ph) | Registered | Varies | Active |

### After Trial (Recommended)

**Option 1: Keep Google Workspace** (Professional)
- Cost: ₱336/month per user
- Includes: 30GB storage, custom email, Google Drive
- Best for: Schools wanting full Google integration

**Option 2: Email Forwarding Only** (Budget-Friendly)
- Cost: FREE (most domain registrars include this)
- Forward `official@edusync.ph` → `kramlig.dotillos@gmail.com`
- Best for: Startups, side projects

**Recommendation:** Start with Option 2 after trial expires, upgrade to Option 1 when you have paying customers.

---

## ✅ Final Checklist

### Before Trial Expires (Dec 07, 2025)

- [ ] Test all email flows thoroughly
- [ ] Backup important emails from Google Workspace
- [ ] Decide: Keep Google Workspace or switch to forwarding
- [ ] Update billing if keeping Google Workspace
- [ ] Document email account credentials securely

### Production Readiness

- [ ] All DNS records verified
- [ ] SendGrid domain authenticated
- [ ] Verified senders created
- [ ] Firebase Functions deployed with new email
- [ ] Test email sending end-to-end
- [ ] Monitor SendGrid deliverability for 1 week

---

## 📞 Need Help?

### SendGrid Support
- **Documentation:** https://docs.sendgrid.com
- **Support:** https://support.sendgrid.com

### Google Workspace Support  
- **Help Center:** https://support.google.com/a
- **Community:** https://support.google.com/a/community

### EduSync Development
- **GitHub Issues:** [Your repo]/issues
- **Developer Email:** dev@edusync.ph (once created)

---

## 📝 Notes

**Created:** November 11, 2025  
**Last Updated:** November 11, 2025  
**Next Review:** December 1, 2025 (before trial expires)

**Important:** Save this guide and review it before your trial expires on Dec 07, 2025.
