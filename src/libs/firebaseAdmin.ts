import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Must run at module load — conditional/lazy init is tree-shaken in the Hosting
 * SSR bundle and causes "default Firebase app does not exist" in production.
 * @see https://github.com/firebase/firebase-tools/issues/8244
 */
if (!getApps().length) {
  initializeApp({
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      'burgertime-48011',
  });
}

/** Pages Router: import only from `getServerSideProps` (never from client components). */
export function getAdminFirestore() {
  return getFirestore();
}
