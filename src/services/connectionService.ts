/**
 * Connection Service
 * 
 * Provides utilities for checking network connectivity
 * and ensuring financial operations require online connection.
 * 
 * CRITICAL: Financial operations must be performed online to:
 * - Prevent duplicate receipt numbers
 * - Maintain audit trail integrity
 * - Avoid data conflicts
 * - Ensure BIR compliance
 */

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for online connection (with timeout)
 */
export async function waitForOnline(timeoutMs: number = 5000): Promise<boolean> {
  if (isOnline()) return true;
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeoutMs);
    
    const onlineHandler = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };
    
    window.addEventListener('online', onlineHandler);
  });
}

/**
 * Require online connection for financial operations
 * Throws error if offline to prevent data corruption
 */
export function requireOnlineConnection(operationName: string): void {
  if (!isOnline()) {
    throw new Error(
      `${operationName} requires an internet connection. ` +
      `This ensures financial data integrity and prevents duplicate transactions. ` +
      `Please check your connection and try again.`
    );
  }
}

/**
 * Custom hook for online status
 */
export function useOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  
  const [online, setOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return online;
}

// For components that need React
import * as React from 'react';

/**
 * Error messages for different offline scenarios
 */
export const OFFLINE_MESSAGES = {
  PAYMENT: 'Payment recording requires an internet connection to ensure receipt numbers are sequential and transactions are properly recorded.',
  RECEIPT: 'Receipt generation requires an internet connection to prevent duplicate receipt numbers.',
  FEE_STRUCTURE: 'Fee structure changes require an internet connection to maintain data consistency across all devices.',
  VERIFICATION: 'Payment proof verification requires an internet connection to update student ledgers accurately.',
  LEDGER_UPDATE: 'Ledger updates require an internet connection to prevent data conflicts.',
  GENERAL: 'This financial operation requires an internet connection for data integrity.',
} as const;

/**
 * Get user-friendly offline message
 */
export function getOfflineMessage(operation: keyof typeof OFFLINE_MESSAGES = 'GENERAL'): string {
  return OFFLINE_MESSAGES[operation];
}
