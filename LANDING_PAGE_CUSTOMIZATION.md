# Landing Page Customization Guide

This guide shows you how to personalize the EduSync landing page with your actual content.

## 🎯 Quick Start Checklist

### Step 1: Update Contact Information (5 minutes)

**File:** `src/config/landingPageConfig.ts`

```typescript
export const CONTACT_INFO = {
  email: 'your-email@domain.com',        // ← Your actual email
  phone: '+63 XXX XXX XXXX',              // ← Your phone number
  phoneDisplay: '0XXX XXX XXXX',          // ← Display format
  
  liveChatUrl: 'https://your-chat-url',   // ← Chat widget URL
  demoBookingUrl: 'https://calendly.com/your-link', // ← Booking link
};
```

### Step 2: Add Google Analytics (10 minutes)

1. Create a Google Analytics 4 property at https://analytics.google.com
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Update in `landingPageConfig.ts`:

```typescript
export const GOOGLE_ANALYTICS_ID = 'G-XXXXXXXXXX'; // ← Your GA4 ID

export const LANDING_PAGE_FEATURES = {
  enableGoogleAnalytics: true,  // ← Enable tracking
  // ...
};
```

### Step 3: Add Real Screenshots (30 minutes)

1. Take screenshots of your system:
   - Dashboard view
   - DepEd forms (Form 137/138)
   - Enrollment portal
   - Analytics charts
   - Mobile view

2. Save them in: `public/assets/screenshots/`

3. Update in `landingPageConfig.ts`:

```typescript
export const SCREENSHOTS = {
  hero: '/assets/screenshots/dashboard-hero.png',
  dashboard: '/assets/screenshots/admin-dashboard.png',
  forms: '/assets/screenshots/deped-forms.png',
  enrollment: '/assets/screenshots/enrollment-portal.png',
  analytics: '/assets/screenshots/analytics-charts.png',
  mobile: '/assets/screenshots/mobile-view.png'
};

export const LANDING_PAGE_FEATURES = {
  showRealScreenshots: true,  // ← Enable screenshots
};
```

### Step 4: Create Demo Video (1-2 hours)

**Option A: Record with OBS Studio (Free)**
1. Download OBS Studio: https://obsproject.com/
2. Record 2-3 minute walkthrough showing:
   - Quick login
   - Dashboard overview
   - Adding a student
   - Generating Form 138
   - Viewing analytics
3. Upload to YouTube (unlisted or public)
4. Get video ID from URL: `https://youtube.com/watch?v=VIDEO_ID_HERE`

**Option B: Use Loom (Easy)**
1. Sign up at https://loom.com
2. Record screen + webcam
3. Share link and extract video ID

Update in `landingPageConfig.ts`:

```typescript
export const DEMO_VIDEO = {
  youtubeId: 'YOUR_VIDEO_ID',  // ← From YouTube URL
  title: 'EduSync System Walkthrough',
  duration: '2:30'
};

export const LANDING_PAGE_FEATURES = {
  showDemoVideo: true,  // ← Enable video
};
```

### Step 5: Update Testimonials (15 minutes)

**Option A: Real Testimonials** (after pilot schools)
```typescript
export const TESTIMONIALS = [
  {
    name: 'Actual Principal Name',
    role: 'School Principal',
    school: 'Actual School Name',
    location: 'City/Province',
    quote: 'Real feedback from pilot school...',
    rating: 5,
  },
];
```

**Option B: Placeholder** (keep current generic ones until you have real feedback)

### Step 6: Add Pilot School Logos (optional)

When you have pilot schools:
1. Get their logo (PNG, transparent background preferred)
2. Save in: `public/assets/schools/`
3. Update:

```typescript
export const PILOT_SCHOOLS = [
  { name: 'School Name', logo: '/assets/schools/school-logo.png' },
  { name: 'Another School', logo: '/assets/schools/school2-logo.png' },
];

export const LANDING_PAGE_FEATURES = {
  showPilotSchools: true,  // ← Show logos
};
```

## 📊 Recommended Screenshot Guide

### Hero Section Screenshot
- **What to capture:** Clean dashboard view with sample data
- **Resolution:** 1920x1080 (landscape)
- **Tip:** Use demo account with realistic data (not test123 names)

### Mobile Screenshot
- **What to capture:** Mobile view of student dashboard or parent portal
- **Resolution:** 375x812 (iPhone X/11/12 size)
- **Tool:** Chrome DevTools device emulator

### Forms Screenshot
- **What to capture:** Generated Form 138 or Form 137
- **Tip:** Blur sensitive student names if using real data

## 🎨 Advanced Customizations

### Change Color Scheme

**File:** `src/components/marketing/LandingPage.tsx`

Find gradient classes and update:
```tsx
// Hero section - line ~20
<section className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
//                                      ↑ Change these colors

// Button colors - line ~50
<button className="bg-white text-indigo-700 hover:bg-yellow-300">
//                  ↑ Customize button styles
```

### Add Live Chat Widget

**Option A: Tawk.to (Free)**
1. Sign up at https://tawk.to
2. Get widget code
3. Add to `public/index.html` before `</body>`:

```html
<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
```

**Option B: Facebook Messenger**
1. Set up Facebook Page
2. Add Messenger plugin: https://developers.facebook.com/docs/messenger-platform/discovery/customer-chat-plugin

Update config:
```typescript
export const LANDING_PAGE_FEATURES = {
  showLiveChat: true,  // ← Enable chat button
};
```

## 🚀 Deployment After Customization

After making changes:

```powershell
# 1. Build production version
npm run build

# 2. Test locally
npm run preview

# 3. Deploy to Firebase
firebase deploy --only hosting

# 4. Verify live site
# Visit: https://edusync-sis.web.app/
```

## 📈 Tracking Setup

Once Google Analytics is enabled, you can track:

- **Page views:** How many visitors
- **CTA clicks:** Which buttons are clicked most
- **Scroll depth:** How far users scroll
- **Enrollment conversions:** Applications submitted
- **Pricing interactions:** Which plan users view

Access dashboard at: https://analytics.google.com

## 🎯 Priority Order

1. ✅ **Contact info** (5 min) - Do this first!
2. ✅ **Google Analytics** (10 min) - Track everything
3. ✅ **Screenshots** (30 min) - Professional look
4. ⏳ **Demo video** (1-2 hrs) - High value, takes time
5. ⏳ **Testimonials** (wait for pilots) - Get real feedback
6. ⏳ **Live chat** (optional) - Nice to have

## ❓ Need Help?

- **Screenshots too large?** Use TinyPNG.com to compress
- **Video too long?** Aim for 2-3 minutes max
- **Can't record video?** Use screenshots with voiceover
- **No pilot schools yet?** Keep generic testimonials for now

## 📝 Quick Test Checklist

After customization:
- [ ] Contact email works (sends to real inbox)
- [ ] Phone number displays correctly
- [ ] Demo video plays
- [ ] Screenshots load fast
- [ ] Google Analytics tracking shows data
- [ ] Mobile view looks good
- [ ] All CTAs redirect correctly

---

**Next Steps:** Once landing page is polished, move to mobile testing! 📱
