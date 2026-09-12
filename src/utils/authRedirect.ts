export const AUTH_REDIRECT_PENDING_KEY = 'burgertime:authRedirectPending';

export function markAuthRedirectPending(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, '1');
  } catch {
    // sessionStorage unavailable (private mode)
  }
}

export function consumeAuthRedirectPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const pending = sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) === '1';
    if (pending) {
      sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
    }
    return pending;
  } catch {
    return false;
  }
}
