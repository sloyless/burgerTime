import * as admin from 'firebase-admin';

/**
 * Unconditional init — `if (!getApps().length)` is tree-shaken in Firebase Hosting SSR
 * bundles and causes "default Firebase app does not exist" on dynamic routes.
 * @see https://github.com/firebase/firebase-tools/issues/8244
 */
try {
  admin.initializeApp({
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      'burgertime-48011',
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes('already exists')) {
    throw error;
  }
}

/** Pages Router: import only from `getServerSideProps` (never from client components). */
export function getAdminFirestore() {
  return admin.firestore();
}
