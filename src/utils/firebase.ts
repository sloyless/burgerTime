import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const PROJECT_AUTH_HANDLER_HOST = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
  : 'burgertime-48011.firebaseapp.com';

const CUSTOM_SITE_HOSTS = new Set(['burgertime.app', 'www.burgertime.app']);

/** Use the site hostname as authDomain on production (OAuth return stays on-site). */
export function resolveClientAuthDomain(): string {
  const configured =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? PROJECT_AUTH_HANDLER_HOST;

  if (typeof window === 'undefined') {
    return configured;
  }

  const hostname = window.location.hostname;
  if (CUSTOM_SITE_HOSTS.has(hostname)) {
    return hostname === 'www.burgertime.app' ? 'burgertime.app' : hostname;
  }

  return configured;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: resolveClientAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function initAuth(): Auth {
  if (typeof window === 'undefined') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : '';
    if (code === 'auth/already-initialized') {
      return getAuth(app);
    }
    return getAuth(app);
  }
}

export const auth = initAuth();

function initDatabase(): Firestore {
  if (typeof window === 'undefined') {
    return getFirestore(app);
  }

  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(app);
  }
}

export const database = initDatabase();

/** Use the bucket from Firebase config so upload URLs match `storageBucket` in the console. */
export const storage = getStorage(app);

export { PROJECT_AUTH_HANDLER_HOST };
