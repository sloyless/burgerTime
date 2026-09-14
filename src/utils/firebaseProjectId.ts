/** Project id for Admin SDK and fallbacks when env vars are unset (local dev). */
export function getFirebaseProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    'burgertime-48011'
  );
}
