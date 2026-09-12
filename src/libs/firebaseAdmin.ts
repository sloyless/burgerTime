import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function parseServiceAccountJson(raw: string): ServiceAccount {
  let json = raw.trim();

  if (
    (json.startsWith("'") && json.endsWith("'")) ||
    (json.startsWith('"') && json.endsWith('"'))
  ) {
    json = json.slice(1, -1);
  }

  try {
    return JSON.parse(json) as ServiceAccount;
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Prefer GOOGLE_APPLICATION_CREDENTIALS pointing at the downloaded key file, or paste the entire key file as one line (double-quoted JSON, private_key newlines as \\n).'
    );
  }
}

/** Pages Router: import only from `getServerSideProps` (never from client components). */
function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath) {
    initializeApp({ credential: applicationDefault() });
    return;
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline?.trim()) {
    initializeApp({
      credential: cert(parseServiceAccountJson(inline)),
    });
    return;
  }

  // Firebase Hosting SSR / Cloud Functions: Application Default Credentials.
  initializeApp();
}

export function getAdminFirestore() {
  initFirebaseAdmin();
  return getFirestore();
}
