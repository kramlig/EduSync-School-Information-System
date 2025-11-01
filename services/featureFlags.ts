/**
 * Feature Flags Service
 * 
 * Controls which features are enabled based on school type and configuration.
 * This allows the same codebase to support both public and private schools.
 */

import type { SchoolSettings } from '../types';

export class FeatureFlags {
  /**
   * Check if financial features should be enabled
   */
  static isFinancialEnabled(settings: SchoolSettings): boolean {
    // Financial features are disabled for public schools
    if (settings.schoolType === 'public') {
      return false;
    }
    
    // For private/hybrid schools, check the explicit config
    return settings.financialConfig?.enabled ?? false;
  }
  
  /**
   * Check if payment is required for enrollment
   */
  static requiresPaymentForEnrollment(settings: SchoolSettings): boolean {
    return this.isFinancialEnabled(settings) && 
           (settings.financialConfig?.requiresPayment ?? false);
  }
  
  /**
   * Check if partial payments are allowed
   */
  static allowsPartialPayment(settings: SchoolSettings): boolean {
    return this.isFinancialEnabled(settings) && 
           (settings.financialConfig?.allowPartialPayment ?? true);
  }
  
  /**
   * Get grace period days for payments
   */
  static getGracePeriodDays(settings: SchoolSettings): number {
    if (!this.isFinancialEnabled(settings)) {
      return 0;
    }
    return settings.financialConfig?.gracePeriodDays ?? 7;
  }
  
  /**
   * Get penalty rate for late payments
   */
  static getPenaltyRate(settings: SchoolSettings): number {
    if (!this.isFinancialEnabled(settings)) {
      return 0;
    }
    return settings.financialConfig?.penaltyRate ?? 0;
  }
  
  /**
   * Get currency symbol
   */
  static getCurrencySymbol(settings: SchoolSettings): string {
    const currency = settings.financialConfig?.currency ?? 'PHP';
    const symbols: Record<string, string> = {
      PHP: '₱',
      USD: '$',
      EUR: '€'
    };
    return symbols[currency] || currency;
  }
  
  /**
   * Check if enrollment applications are required
   */
  static requiresEnrollmentApplication(settings: SchoolSettings): boolean {
    return settings.enrollmentConfig?.requiresApplication ?? true;
  }
  
  /**
   * Check if document upload is required
   */
  static requiresDocumentUpload(settings: SchoolSettings): boolean {
    return settings.enrollmentConfig?.requiresDocuments ?? true;
  }
  
  /**
   * Check if applications are auto-approved
   */
  static isAutoApproveEnabled(settings: SchoolSettings): boolean {
    return settings.enrollmentConfig?.autoApprove ?? false;
  }
  
  /**
   * Check if parent self-registration is allowed
   */
  static allowsSelfRegistration(settings: SchoolSettings): boolean {
    return settings.enrollmentConfig?.allowSelfRegistration ?? true;
  }
  
  /**
   * Get school display name with type badge
   */
  static getSchoolDisplayName(settings: SchoolSettings): string {
    const type = settings.schoolType ?? 'public';
    const badges: Record<string, string> = {
      public: '🏫 Public',
      private: '🎓 Private',
      hybrid: '🔀 Hybrid'
    };
    return `${settings.schoolName} ${badges[type]}`;
  }
  
  /**
   * Get feature summary for debugging/admin panel
   */
  static getFeatureSummary(settings: SchoolSettings): {
    schoolType: string;
    financialEnabled: boolean;
    enrollmentApplicationRequired: boolean;
    documentUploadRequired: boolean;
    autoApprove: boolean;
    selfRegistration: boolean;
    currency: string;
  } {
    return {
      schoolType: settings.schoolType ?? 'public',
      financialEnabled: this.isFinancialEnabled(settings),
      enrollmentApplicationRequired: this.requiresEnrollmentApplication(settings),
      documentUploadRequired: this.requiresDocumentUpload(settings),
      autoApprove: this.isAutoApproveEnabled(settings),
      selfRegistration: this.allowsSelfRegistration(settings),
      currency: settings.financialConfig?.currency ?? 'PHP'
    };
  }
}

/**
 * Hook-like helper for React components
 * Usage: const financialEnabled = useFinancialFeatures(settings);
 */
export function useFinancialFeatures(settings: SchoolSettings) {
  return {
    enabled: FeatureFlags.isFinancialEnabled(settings),
    requiresPayment: FeatureFlags.requiresPaymentForEnrollment(settings),
    allowsPartial: FeatureFlags.allowsPartialPayment(settings),
    gracePeriod: FeatureFlags.getGracePeriodDays(settings),
    penaltyRate: FeatureFlags.getPenaltyRate(settings),
    currencySymbol: FeatureFlags.getCurrencySymbol(settings),
  };
}

/**
 * Hook-like helper for enrollment features
 */
export function useEnrollmentFeatures(settings: SchoolSettings) {
  return {
    requiresApplication: FeatureFlags.requiresEnrollmentApplication(settings),
    requiresDocuments: FeatureFlags.requiresDocumentUpload(settings),
    autoApprove: FeatureFlags.isAutoApproveEnabled(settings),
    allowsSelfRegistration: FeatureFlags.allowsSelfRegistration(settings),
  };
}
