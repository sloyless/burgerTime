import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  UserCredential,
} from 'firebase/auth';

import { auth } from 'utils/firebase';

const provider = new GoogleAuthProvider();

function getAuthErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

function shouldPreferRedirect(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMacSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);

  return isIOS || isMacSafari;
}

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/popup-closed-by-user',
]);

async function redirectSignIn(): Promise<void> {
  await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
}

export async function signInWithGoogle(): Promise<UserCredential | void> {
  if (shouldPreferRedirect()) {
    await redirectSignIn();
    return;
  }

  try {
    return await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  } catch (error) {
    const code = getAuthErrorCode(error);
    if (code && POPUP_FALLBACK_CODES.has(code)) {
      await redirectSignIn();
      return;
    }
    throw error;
  }
}

export function isSignInCancellationError(error: unknown): boolean {
  return getAuthErrorCode(error) === 'auth/popup-closed-by-user';
}

export function getGoogleSignInHelpMessage(error: unknown): string {
  const code = getAuthErrorCode(error);

  switch (code) {
    case 'auth/unauthorized-domain':
      return (
        'This site is not authorized for Firebase Auth. In Firebase Console → ' +
        'Authentication → Settings → Authorized domains, add "localhost". ' +
        'Use http://localhost:3000 (not 127.0.0.1).'
      );
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Allow popups for localhost or try again.';
    case 'auth/popup-closed-by-user':
      return (
        'The Google sign-in window closed before finishing. Allow popups for ' +
        'localhost, or disable extensions that block Google login.'
      );
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Enable it under Firebase → Authentication → Sign-in method.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_* values in .env and restart the dev server.';
    default:
      return 'Google sign-in failed. Open the browser console for details.';
  }
}
