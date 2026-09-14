import type { IncomingMessage } from 'http';

import {
  initializeServerApp,
  type FirebaseServerAppSettings,
} from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';

import { getFirebaseWebConfig } from 'utils/firebaseConfig';

/**
 * Request-scoped Firestore for Pages Router `getServerSideProps`.
 * Uses Firebase's recommended `initializeServerApp` (respects Security Rules).
 */
export function getServerFirestore(req: IncomingMessage): Firestore {
  const settings: FirebaseServerAppSettings = {
    releaseOnDeref: req,
  };

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    settings.authIdToken = authHeader.slice('Bearer '.length);
  }

  const serverApp = initializeServerApp(getFirebaseWebConfig(), settings);

  try {
    return initializeFirestore(serverApp, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(serverApp);
  }
}
