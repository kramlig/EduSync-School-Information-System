# EduSync Domain Setup Guide
## edusync.ph Configuration

This guide walks you through setting up your custom domain with Firebase Hosting and SendGrid email.

---

## Part 1: Firebase Hosting Setup (Website)

### Step 1: Add Custom Domain in Firebase Console

1. Go to: https://console.firebase.google.com/project/edusync-sis/hosting/sites
2. Click on **"edusync-sis"** site
3. Click **"Add custom domain"** button
4. Enter: `edusync.ph`
5. Click **"Continue"**

### Step 2: Get DNS Records from Firebase

Firebase will show you records like this:

```
Type: A
Name: @
Value: 151.101.1.195

Type: A
Name: @
Value: 151.101.65.195
```

**IMPORTANT:** Copy these exact values! They might be slightly different.

### Step 3: Add DNS Records to Your Domain Registrar

Go to your domain registrar's DNS management page (where you bought edusync.ph).

**Add these A Records:**

| Type | Name/Host | Value/Points To | TTL |
|------|-----------|-----------------|-----|
| A    | @         | 151.101.1.195   | 3600 |
| A    | @         | 151.101.65.195  | 3600 |

**Optional - Add WWW subdomain:**

| Type  | Name/Host | Value/Points To | TTL |
|-------|-----------|-----------------|-----|
| CNAME | www       | edusync-sis.web.app | 3600 |

### Step 4: Wait for Propagation

- DNS changes take 5 minutes to 48 hours
- Usually works within 1-2 hours
- Firebase will automatically provision SSL certificate
- You'll get an email when it's ready

---

## Part 2: Email Setup with SendGrid

### Step 1: Verify Domain in SendGrid

1. Go to: https://app.sendgrid.com/settings/sender_auth/domains
2. Click **"Authenticate Your Domain"**
3. Select **"Use my own DNS provider"**
4. Enter domain: `edusync.ph`
5. Click **"Next"**

### Step 2: Add SendGrid DNS Records

SendGrid will give you 3 DNS records:

**Example (your values will be different):**

| Type  | Name/Host | Value/Points To | TTL |
|-------|-----------|-----------------|-----|
| CNAME | em1234.edusync.ph | u12345.wl123.sendgrid.net | 3600 |
| CNAME | s1._domainkey.edusync.ph | s1.domainkey.u12345.wl123.sendgrid.net | 3600 |
| CNAME | s2._domainkey.edusync.ph | s2.domainkey.u12345.wl123.sendgrid.net | 3600 |

**Add all 3 records to your domain registrar's DNS settings.**

### Step 3: Verify in SendGrid

After adding DNS records:
1. Go back to SendGrid
2. Click **"Verify"**
3. Wait for confirmation (usually 5-10 minutes)

### Step 4: Create Sender Identity

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **"Create New Sender"**
3. Fill in:
   - **From Name:** EduSync
   - **From Email Address:** official@edusync.ph (or hello@edusync.ph)
   - **Reply To:** official@edusync.ph
   - **Company Name:** EduSync
   - **Address:** Your school/office address
4. Click **"Create"**
5. Check your email for verification link
6. Click verification link

---

## Part 3: Email Forwarding (Receive Emails)

### Option A: Basic Email Forwarding (FREE)

Most domain registrars include email forwarding. Set up:

**Forwards:**
- `official@edusync.ph` → `kramlig.dotillos@gmail.com`
- `hello@edusync.ph` → `kramlig.dotillos@gmail.com`
- `support@edusync.ph` → `kramlig.dotillos@gmail.com`

**How to set up:**
1. Go to your domain registrar's control panel
2. Find "Email Forwarding" or "Mail Settings"
3. Add forwarding rules
4. Test by sending email to official@edusync.ph

### Option B: Google Workspace (PAID - ₱336/month)

If you want a real mailbox:
1. Go to: https://workspace.google.com
2. Sign up with `edusync.ph`
3. Follow Google's setup instructions
4. Add MX records to DNS

---

## Part 4: Update Firebase Configuration

After DNS propagation, update environment variables:

**File:** `functions/.env`

```env
SENDGRID_FROM_EMAIL=official@edusync.ph
```

Redeploy functions:
```bash
firebase deploy --only functions --project edusync-sis
```

---

## Part 5: Testing

### Test Website:
1. Visit: https://edusync.ph
2. Should redirect from HTTP to HTTPS automatically
3. Should show your landing page
4. SSL certificate should be valid (green lock)

### Test Email Sending:
1. Go to: https://edusync.ph
2. Click "Start Free Trial"
3. Fill out the form
4. Submit
5. Check your Gmail for trial signup email
6. Email should show FROM: official@edusync.ph

### Test Email Receiving:
1. Send test email to: official@edusync.ph
2. Should arrive in kramlig.dotillos@gmail.com
3. Verify it arrives within 1-2 minutes

---

## Troubleshooting

### Website not loading?
- Check DNS propagation: https://dnschecker.org
- Wait up to 24 hours for DNS to propagate
- Clear browser cache (Ctrl+Shift+Delete)

### SSL certificate not working?
- Firebase provisions SSL automatically after DNS verification
- Wait 30 minutes to 24 hours
- Check Firebase Console for status

### Emails not sending?
- Verify sender in SendGrid: https://app.sendgrid.com/settings/sender_auth/senders
- Check Firebase Functions logs: https://console.firebase.google.com/project/edusync-sis/functions/logs
- Ensure SENDGRID_FROM_EMAIL matches verified sender

### Email forwarding not working?
- Check forwarding rules in domain registrar
- Verify DNS MX records if using custom email
- Wait 30 minutes for propagation
- Test with different sender (not the same domain)

---

## Quick Reference

**Your Domains:**
- Old: https://edusync-sis.web.app (still works)
- New: https://edusync.ph (primary)

**Your Emails:**
- Send FROM: official@edusync.ph
- Receive TO: kramlig.dotillos@gmail.com (via forwarding)

**Important Links:**
- Firebase Console: https://console.firebase.google.com/project/edusync-sis
- SendGrid Dashboard: https://app.sendgrid.com
- Domain Registrar: [Your .PH registrar]

---

## Need Help?

If you encounter issues, check:
1. Firebase Console for hosting status
2. SendGrid for authentication status
3. DNS checker for propagation status
4. Firebase Functions logs for errors

**Contact Firebase Support:** https://firebase.google.com/support
**Contact SendGrid Support:** https://support.sendgrid.com
