import {
  PROJECT_AUTH_HANDLER_HOST,
  resolveClientAuthDomain,
} from 'utils/firebaseAuthDomain';

/** Shared Firebase web config (client + `initializeServerApp` on the server). */
export function getFirebaseWebConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:
      typeof window === 'undefined'
        ? (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
          PROJECT_AUTH_HANDLER_HOST)
        : resolveClientAuthDomain(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}
