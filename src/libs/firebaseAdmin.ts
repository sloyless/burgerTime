import * as admin from 'firebase-admin';

import { getFirebaseProjectId } from 'utils/firebaseProjectId';

/**
 * Unconditional init — conditional checks are tree-shaken in Firebase Hosting SSR bundles.
 * @see https://github.com/firebase/firebase-tools/issues/8244
 */
try {
  admin.initializeApp({ projectId: getFirebaseProjectId() });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes('already exists')) {
    throw error;
  }
}

/** Import only from server code (e.g. `getServerSideProps`), never from client components. */
export function getAdminFirestore() {
  return admin.firestore();
}
