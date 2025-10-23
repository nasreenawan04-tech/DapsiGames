/**
 * Centralized utility for handling post-authentication redirects
 * Ensures consistent redirect behavior across all auth flows
 */

const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';
const DEFAULT_REDIRECT = '/dashboard';

/**
 * Store the current path for redirect after login
 * Only stores if the path is not already a login/signup page
 */
export function storeRedirectPath(currentPath: string): void {
  if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
    sessionStorage.setItem(REDIRECT_STORAGE_KEY, currentPath);
  }
}

/**
 * Get the stored redirect path and remove it from storage
 * Returns null if no valid path is stored
 */
export function consumeRedirectPath(): string | null {
  const path = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
  if (path && path !== '/login' && path !== '/signup') {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    return path;
  }
  sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  return null;
}

/**
 * Get the redirect destination after successful authentication
 * Prioritizes stored redirect path, falls back to provided default or /dashboard
 */
export function getRedirectPath(fallback: string = DEFAULT_REDIRECT): string {
  const storedPath = consumeRedirectPath();
  return storedPath || fallback;
}

/**
 * Clear the stored redirect path without consuming it
 */
export function clearRedirectPath(): void {
  sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
}
