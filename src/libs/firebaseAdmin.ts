import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/** Pages Router: dynamic-import from server data loaders only (never client components). */
function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  // Cloud Functions / Cloud Run (Firebase Hosting SSR): Application Default Credentials.
  initializeApp();
}

export function getAdminFirestore() {
  initFirebaseAdmin();
  return getFirestore();
}
