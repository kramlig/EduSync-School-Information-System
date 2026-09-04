# DNS Configuration Guide for staging.edusync.ph

## Overview
This guide shows you how to configure your DNS records to point `staging.edusync.ph` to your Firebase Hosting staging project.

## Prerequisites
- You own the domain `edusync.ph`
- You have access to your domain registrar's DNS management panel
- You've created the Firebase staging project (`edusync-sis-staging`)

---

## Step 1: Get Firebase Hosting IPs

Firebase will provide these when you add the custom domain. Typical Firebase hosting IPs are:

```
151.101.1.195
151.101.65.195
```

---

## Step 2: Add DNS Records

Log in to your domain registrar (where you bought edusync.ph) and add these records:

### For staging.edusync.ph

**A Records (IPv4):**
```
Type: A
Name: staging
TTL: 3600
Value: 151.101.1.195
```

```
Type: A  
Name: staging
TTL: 3600
Value: 151.101.65.195
```

**TXT Record (Verification):**
```
Type: TXT
Name: staging
TTL: 3600
Value: firebase=edusync-sis-staging
```

(Firebase will provide the exact TXT value when you add the custom domain)

---

## Step 3: Common Domain Registrars

### For Namecheap:
1. Go to Domain List → Manage → Advanced DNS
2. Click "Add New Record"
3. Select record type (A or TXT)
4. Host: `staging`
5. Value: (IP or verification string)
6. TTL: Automatic or 3600

### For GoDaddy:
1. Go to My Products → DNS
2. Click "Add" button
3. Type: A or TXT
4. Name: staging
5. Value: (IP or verification string)
6. TTL: 1 Hour

### For Cloudflare:
1. Go to DNS → Records
2. Click "Add record"
3. Type: A or TXT
4. Name: staging
5. Content: (IP or verification string)
6. Proxy status: DNS only (gray cloud)
7. TTL: Auto

### For Google Domains:
1. Go to DNS settings
2. Under "Custom resource records"
3. Name: staging
4. Type: A or TXT
5. TTL: 1H
6. Data: (IP or verification string)

---

## Step 4: Verify Configuration

### Using Command Line:

**Check A records:**
```bash
nslookup staging.edusync.ph
```

Expected output:
```
Server:  your-dns-server
Address:  xxx.xxx.xxx.xxx

Name:    staging.edusync.ph
Addresses:  151.101.1.195
            151.101.65.195
```

**Check TXT records:**
```bash
nslookup -type=TXT staging.edusync.ph
```

Expected output:
```
staging.edusync.ph  text = "firebase=edusync-sis-staging"
```

### Using Online Tools:

1. **DNSChecker.org**
   - https://dnschecker.org
   - Enter: `staging.edusync.ph`
   - Check global propagation

2. **What's My DNS**
   - https://www.whatsmydns.net
   - Enter: `staging.edusync.ph`
   - Type: A
   - See propagation across different locations

---

## Step 5: Firebase Console Verification

1. Go to Firebase Console
2. Navigate to: Hosting → Custom Domains
3. Firebase will automatically verify the TXT record
4. Once verified, Firebase will issue SSL certificate
5. Wait for "Connected" status (can take up to 24 hours)

---

## Timeline

| Step | Time |
|------|------|
| DNS record creation | Immediate |
| DNS propagation | 10 minutes - 24 hours |
| Firebase verification | 5-30 minutes |
| SSL certificate issuance | 10 minutes - 24 hours |
| **Total** | **30 minutes - 48 hours** |

*Most propagations complete within 1-2 hours*

---

## Troubleshooting

### DNS not propagating
```bash
# Clear local DNS cache (Windows)
ipconfig /flushdns

# Clear local DNS cache (Mac)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Clear local DNS cache (Linux)
sudo systemd-resolve --flush-caches
```

### Firebase can't verify domain
- Double-check TXT record value matches exactly what Firebase provided
- Wait 15-30 minutes after adding TXT record
- Use DNSChecker.org to confirm TXT record is visible globally
- Try removing and re-adding the custom domain in Firebase Console

### SSL certificate not issuing
- Ensure A records point to correct Firebase IPs
- Wait up to 24 hours for automatic issuance
- Check Firebase Console for error messages
- Ensure domain isn't redirected by Cloudflare or other CDN

### Site not loading after DNS propagation
- Check Firebase deployment status: `firebase hosting:channel:list`
- Verify deployment exists: `firebase deploy --only hosting`
- Check browser console for errors
- Try incognito/private window (clears cache)

---

## Production DNS (for reference)

Your production setup should look like:

**edusync.ph (root domain):**
```
A     @         151.101.1.195
A     @         151.101.65.195
TXT   @         firebase=edusync-sis
```

**staging.edusync.ph:**
```
A     staging   151.101.1.195
A     staging   151.101.65.195
TXT   staging   firebase=edusync-sis-staging
```

---

## Security Considerations

1. **Use HTTPS only** - Firebase automatically provides SSL
2. **CAA Records (optional but recommended):**
   ```
   Type: CAA
   Name: staging
   Value: 0 issue "letsencrypt.org"
   ```
3. **HSTS Header** - Configured in Firebase hosting headers
4. **Restrict Firestore access** - Use security rules for staging environment

---

## Next Steps

After DNS is configured and propagated:

1. ✅ Access your staging site: https://staging.edusync.ph
2. ✅ Seed staging database: `npm run seed:staging`
3. ✅ Run E2E tests: `npm run test:staging`
4. ✅ Share staging URL with team for testing
5. ✅ Use for demos and client presentations

---

**Need Help?**

- Firebase Hosting Docs: https://firebase.google.com/docs/hosting/custom-domain
- Firebase Support: https://firebase.google.com/support
- DNS Propagation Check: https://dnschecker.org
