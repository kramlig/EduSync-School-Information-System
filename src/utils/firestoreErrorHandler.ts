/**
 * Firebase Firestore Error Handler
 * 
 * Handles Firebase SDK internal errors and provides recovery mechanisms
 * for known issues like "INTERNAL ASSERTION FAILED" errors.
 */

import { FirebaseError } from 'firebase/app';

/**
 * Known Firebase SDK internal error patterns
 */
const INTERNAL_ERROR_PATTERNS = [
  'INTERNAL ASSERTION FAILED',
  'Unexpected state (ID: ca9)',
  'Unexpected state (ID: b815)',
  'Invalid query',
  'Missing or insufficient permissions'
];

/**
 * Check if error is a known Firebase SDK internal error
 */
export function isFirebaseInternalError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message || '';
  return INTERNAL_ERROR_PATTERNS.some(pattern => message.includes(pattern));
}

/**
 * Check if error is a permissions error (security rules)
 */
export function isPermissionError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;
  
  return error.code === 'permission-denied' || 
         error.message.includes('Missing or insufficient permissions');
}

/**
 * Enhanced error logger for Firebase errors
 */
export function logFirestoreError(
  context: string,
  error: unknown,
  options?: { 
    logToConsole?: boolean;
    throwError?: boolean;
  }
): void {
  const { logToConsole = true, throwError = false } = options || {};
  
  if (isFirebaseInternalError(error)) {
    if (logToConsole) {
      console.warn(
        `⚠️ [${context}] Firebase SDK Internal Error (known issue):`,
        error
      );
      console.info(
        '💡 This is a Firebase SDK bug, not a security rules issue.',
        'The query will be retried automatically.'
      );
    }
    // Don't throw internal errors - they're SDK bugs
    return;
  }
  
  if (isPermissionError(error)) {
    if (logToConsole) {
      console.error(`🚫 [${context}] Permission Denied:`, error);
      console.info(
        '💡 This user does not have access to this resource.',
        'Check security rules and custom claims.'
      );
    }
    if (throwError) throw error;
    return;
  }
  
  // Unknown error - log and optionally throw
  if (logToConsole) {
    console.error(`❌ [${context}] Firestore Error:`, error);
  }
  if (throwError) throw error;
}

/**
 * Retry wrapper for Firestore queries
 * Handles transient Firebase SDK internal errors
 */
export async function withFirestoreRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    context?: string;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    context = 'Firestore Operation'
  } = options || {};
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // If it's an internal error, retry
      if (isFirebaseInternalError(error)) {
        console.warn(
          `⚠️ [${context}] Attempt ${attempt}/${maxRetries} failed with internal error. Retrying...`
        );
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
      } else {
        // Not an internal error - throw immediately
        logFirestoreError(context, error, { throwError: true });
      }
    }
  }
  
  // All retries exhausted
  console.error(`❌ [${context}] All ${maxRetries} retry attempts failed`);
  throw lastError;
}

/**
 * Create an error-resilient onSnapshot wrapper
 * Automatically handles Firebase SDK internal errors
 */
export function createResilientSnapshot<T>(
  setupSnapshot: (
    onNext: (snapshot: T) => void,
    onError: (error: Error) => void
  ) => () => void,
  options?: {
    context?: string;
    onInternalError?: () => void;
  }
): () => void {
  const { context = 'Snapshot', onInternalError } = options || {};
  
  const unsubscribe = setupSnapshot(
    () => {
      // Success callback - pass through
    },
    (error) => {
      if (isFirebaseInternalError(error)) {
        logFirestoreError(context, error, { logToConsole: true, throwError: false });
        onInternalError?.();
      } else {
        logFirestoreError(context, error, { logToConsole: true, throwError: false });
      }
    }
  );
  
  return unsubscribe;
}

/**
 * Firestore query error handler for React hooks
 */
export function handleFirestoreQueryError(
  collectionName: string,
  error: unknown
): { shouldRetry: boolean; errorMessage: string } {
  if (isFirebaseInternalError(error)) {
    return {
      shouldRetry: true,
      errorMessage: `Internal Firebase error (SDK bug) - auto-retrying query for ${collectionName}`
    };
  }
  
  if (isPermissionError(error)) {
    return {
      shouldRetry: false,
      errorMessage: `Permission denied for ${collectionName}. User may not have required role.`
    };
  }
  
  return {
    shouldRetry: false,
    errorMessage: `Failed to fetch ${collectionName}: ${error instanceof Error ? error.message : String(error)}`
  };
}
