/**
 * Google Analytics Integration
 * 
 * Tracks user interactions on the landing page for optimization.
 * Add your GA4 measurement ID in landingPageConfig.ts
 */

import { useEffect } from 'react';
import { GOOGLE_ANALYTICS_ID, LANDING_PAGE_FEATURES } from '../config/landingPageConfig';

// Initialize Google Analytics
export const initGA = () => {
  if (!LANDING_PAGE_FEATURES.enableGoogleAnalytics || !GOOGLE_ANALYTICS_ID) {
    console.log('[GA] Analytics disabled or ID not configured');
    return;
  }

  // Load GA script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GOOGLE_ANALYTICS_ID);

  console.log('[GA] ✅ Google Analytics initialized:', GOOGLE_ANALYTICS_ID);
};

// Track page views
export const trackPageView = (page: string) => {
  if (!LANDING_PAGE_FEATURES.enableGoogleAnalytics) return;
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'page_view', {
      page_path: page,
    });
    console.log('[GA] Page view tracked:', page);
  }
};

// Track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (!LANDING_PAGE_FEATURES.enableGoogleAnalytics) return;
  
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, eventParams);
    console.log('[GA] Event tracked:', eventName, eventParams);
  }
};

// Predefined event trackers for landing page
export const GAEvents = {
  // CTA clicks
  clickStartTrial: () => trackEvent('click_start_trial', { location: 'hero' }),
  clickWatchDemo: () => trackEvent('click_watch_demo'),
  clickScheduleDemo: () => trackEvent('click_schedule_demo'),
  clickContactSales: () => trackEvent('click_contact_sales'),
  
  // Pricing interactions
  selectPricingPlan: (plan: string) => trackEvent('select_pricing_plan', { plan }),
  clickPricingCTA: (plan: string) => trackEvent('click_pricing_cta', { plan }),
  
  // Engagement
  scrollToSection: (section: string) => trackEvent('scroll_to_section', { section }),
  expandFAQ: (question: string) => trackEvent('expand_faq', { question }),
  
  // Contact
  clickEmail: () => trackEvent('click_email_contact'),
  clickPhone: () => trackEvent('click_phone_contact'),
  clickLiveChat: () => trackEvent('click_live_chat'),
  
  // Social proof
  readTestimonial: (name: string) => trackEvent('read_testimonial', { name }),
  
  // Navigation
  clickEnrollment: () => trackEvent('click_enrollment_link'),
};

// React hook for GA integration
export const useGoogleAnalytics = () => {
  useEffect(() => {
    initGA();
  }, []);

  return {
    trackPageView,
    trackEvent,
    events: GAEvents,
  };
};

// TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
