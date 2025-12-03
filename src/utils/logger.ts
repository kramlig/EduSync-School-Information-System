/**
 * Console Log Suppression Utility
 * 
 * Globally disables console logs based on VITE_VERBOSE_LOGGING environment variable
 * - VITE_VERBOSE_LOGGING=false (default): All logs suppressed (clean console)
 * - VITE_VERBOSE_LOGGING=true: All logs enabled (for debugging)
 * 
 * This file is imported once in App.tsx and runs at startup
 */

const IS_VERBOSE = import.meta.env.VITE_VERBOSE_LOGGING === 'true';

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

export const logger = {
  log: (...args: any[]) => {
    if (IS_VERBOSE) originalConsole.log(...args);
  },
  
  warn: (...args: any[]) => {
    if (IS_VERBOSE) originalConsole.warn(...args);
  },
  
  error: (...args: any[]) => {
    // Always log errors, even when verbose logging is off
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (IS_VERBOSE) originalConsole.info(...args);
  },
  
  debug: (...args: any[]) => {
    if (IS_VERBOSE) originalConsole.debug(...args);
  },
};

// Globally disable console logs if verbose logging is OFF
if (!IS_VERBOSE) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  // Keep console.error for critical issues
  
  // Also suppress console.table, console.dir, etc.
  console.table = () => {};
  console.dir = () => {};
  console.trace = () => {};
  
  console.log('[Logger] 🔇 Console logs suppressed. Set VITE_VERBOSE_LOGGING=true to enable.');
}
