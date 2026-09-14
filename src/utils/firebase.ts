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
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { getFirebaseWebConfig } from 'utils/firebaseConfig';
import { PROJECT_AUTH_HANDLER_HOST } from 'utils/firebaseAuthDomain';
import { isIosWebKit } from 'utils/isIosWebKit';

export { PROJECT_AUTH_HANDLER_HOST };

export const app = getApps().length
  ? getApp()
  : initializeApp(getFirebaseWebConfig());

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
    const localCache = isIosWebKit()
      ? memoryLocalCache()
      : persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        });

    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache,
    });
  } catch {
    return getFirestore(app);
  }
}

export const database = initDatabase();

/** Use the bucket from Firebase config so upload URLs match `storageBucket` in the console. */
export const storage = getStorage(app);
