import { lazy } from 'react';
import type { ComponentType } from 'react';

/**
 * Wraps React.lazy to handle stale chunk errors after deployments.
 * When a dynamic import fails (e.g., old hash no longer exists on server),
 * it reloads the page once to fetch fresh index.html with correct chunk refs.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(() =>
    importFn().catch((error: Error) => {
      const hasReloaded = sessionStorage.getItem('chunk_reload');

      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        // Return a never-resolving promise so React doesn't render the broken module
        return new Promise<{ default: T }>(() => {});
      }

      // Already reloaded once — clear the flag and let the error propagate
      sessionStorage.removeItem('chunk_reload');
      throw error;
    })
  );
}
