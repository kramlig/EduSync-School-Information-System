/**
 * Landing Page Configuration
 * 
 * Centralized configuration for easy customization of landing page content.
 * Update this file to personalize contact info, testimonials, and other dynamic content.
 */

export const CONTACT_INFO = {
  // TODO: Replace with your actual contact information
  email: 'hello@edusync.ph',
  phone: '+63 917 123 4567',
  phoneDisplay: '+63 917 123 4567',
  
  // Social media links (optional)
  facebook: 'https://facebook.com/edusync',
  twitter: 'https://twitter.com/edusync',
  linkedin: 'https://linkedin.com/company/edusync',
  
  // Live chat / Support
  liveChatUrl: 'https://edusync-sis.web.app', // Replace with actual chat widget URL
  supportEmail: 'support@edusync.ph',
  
  // Calendly or booking link for demos
  demoBookingUrl: 'https://calendly.com/edusync/demo',
};

export const COMPANY_INFO = {
  name: 'EduSync',
  fullName: 'EduSync School Information System',
  tagline: 'The Future of School Management',
  description: 'Cloud-based, AI-powered school information system designed for Philippine K-12 schools',
  
  // Office address (optional)
  address: 'Metro Manila, Philippines',
  
  // Business hours
  supportHours: 'Monday - Friday, 9:00 AM - 5:00 PM PHT',
};

export const PRICING = {
  starter: {
    name: 'Starter',
    price: 3999,
    currency: '₱',
    period: '/month',
    description: 'Perfect for small schools',
    maxStudents: 500,
    maxTeachers: 20,
    features: [
      'Up to 500 students',
      '20 teachers',
      'Core features (grades, forms)',
      'Email support',
      '30-day free trial'
    ]
  },
  professional: {
    name: 'Professional',
    price: 7999,
    currency: '₱',
    period: '/month',
    description: 'Most popular choice',
    maxStudents: 1500,
    maxTeachers: 50,
    features: [
      'Up to 1,500 students',
      '50 teachers',
      'All features + AI analytics',
      'Parent portal',
      'Priority support',
      '30-day free trial'
    ],
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    currency: '',
    period: '',
    description: 'For large schools & divisions',
    maxStudents: 'Unlimited',
    maxTeachers: 'Unlimited',
    features: [
      'Unlimited students',
      'Unlimited teachers',
      'All features + customization',
      'Dedicated account manager',
      'On-site training',
      'SLA guarantee'
    ]
  }
};

export const TESTIMONIALS = [
  {
    name: 'Principal Maria Santos',
    role: 'School Principal',
    school: 'San Pedro Elementary School',
    location: 'Laguna',
    quote: 'EduSync cut our form generation time from 2 weeks to 2 hours. The AI insights helped us identify 15 at-risk students early. Game changer!',
    rating: 5,
    // TODO: Add photo: '/assets/testimonials/maria-santos.jpg'
  },
  {
    name: 'Registrar Juan dela Cruz',
    role: 'School Registrar',
    school: 'Nueva Ecija National High School',
    location: 'Nueva Ecija',
    quote: 'The enrollment portal reduced our registration lines by 90%. Parents love applying from home, and we processed 800 students in one week.',
    rating: 5,
    // TODO: Add photo: '/assets/testimonials/juan-delacruz.jpg'
  },
  {
    name: 'Dr. Carmen Reyes',
    role: 'Division Education Supervisor',
    school: 'DepEd Division Office - Metro Manila',
    location: 'Metro Manila',
    quote: 'EduSync\'s EBEIS export feature saved us countless hours during submission deadlines. The data accuracy is perfect.',
    rating: 5,
    // TODO: Add photo: '/assets/testimonials/carmen-reyes.jpg'
  }
];

export const STATS = {
  schoolsInPH: '47,000+',
  timeSaved: '80%',
  fasterForms: '95%',
  depedCompliance: '100%',
  studentsProcessed: '1000+',
  hoursSavedPerYear: '300+',
  parentSatisfaction: '95%',
  calculationErrors: '0'
};

export const DEMO_VIDEO = {
  // TODO: Replace with actual demo video URL
  youtubeId: '', // e.g., 'dQw4w9WgXcQ'
  thumbnailUrl: '', // Custom thumbnail (optional)
  title: 'EduSync System Walkthrough',
  duration: '2:30'
};

export const SCREENSHOTS = {
  // TODO: Add actual screenshot URLs
  hero: '/assets/screenshots/dashboard-hero.png',
  dashboard: '/assets/screenshots/admin-dashboard.png',
  forms: '/assets/screenshots/deped-forms.png',
  enrollment: '/assets/screenshots/enrollment-portal.png',
  analytics: '/assets/screenshots/analytics-charts.png',
  mobile: '/assets/screenshots/mobile-view.png'
};

export const PILOT_SCHOOLS = [
  // TODO: Add logos of pilot schools (when available)
  // { name: 'School Name', logo: '/assets/schools/logo.png' }
];

// Google Analytics tracking ID
export const GOOGLE_ANALYTICS_ID = ''; // TODO: Add GA4 measurement ID (e.g., 'G-XXXXXXXXXX')

// Facebook Pixel ID (optional)
export const FACEBOOK_PIXEL_ID = ''; // TODO: Add if using Facebook Ads

// Feature flags for landing page sections
export const LANDING_PAGE_FEATURES = {
  showDemoVideo: false, // Enable when video is ready
  showPilotSchools: false, // Enable when you have pilot schools
  showLiveChat: false, // Enable when chat widget is integrated
  enableGoogleAnalytics: false, // Enable when GA is set up
  showRealScreenshots: false, // Enable when screenshots are added
};
