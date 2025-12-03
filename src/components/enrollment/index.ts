/**
 * Enrollment Module - Optimized Exports
 * 
 * Performance Optimizations:
 * - All step components use React.memo to prevent unnecessary re-renders
 * - Components are exported for lazy loading via React.lazy()
 * - Removed unused Firebase/Firestore dependencies
 * - Removed debug console.logs (kept error logs)
 * - Multi-school support (no useSchoolData dependency)
 * 
 * Migration Status: ✅ PostgreSQL Complete
 * Last Optimized: December 3, 2025
 */

// Public-facing components
export { EnrollmentPortal } from './portal/EnrollmentPortal';
export { ApplicationForm } from './forms/ApplicationForm';
export { ApplicationStatus } from './status/ApplicationStatus';

// Admin components
export { AdminEnrollmentDashboard } from './admin/AdminEnrollmentDashboard';
export { ApplicationReview } from './admin/ApplicationReview';
export { DocumentViewer } from './admin/DocumentViewer';

// Step components (all optimized with React.memo)
export { SchoolSelectionStep } from './forms/steps/SchoolSelectionStep';
export { StudentInfoStep } from './forms/steps/StudentInfoStep';
export { GuardianDetailsStep } from './forms/steps/GuardianDetailsStep';
export { AddressStep } from './forms/steps/AddressStep';
export { AcademicHistoryStep } from './forms/steps/AcademicHistoryStep';
export { HealthInfoStep } from './forms/steps/HealthInfoStep';
export { DocumentsStep } from './forms/steps/DocumentsStep';
export { ReviewStep } from './forms/steps/ReviewStep';
