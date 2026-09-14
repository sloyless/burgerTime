import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function loadEnvFiles() {
  for (const filename of ['.env.local', '.env.production']) {
    try {
      const raw = readFileSync(join(root, filename), 'utf8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[key] == null) {
          process.env[key] = value;
        }
      }
    } catch {
      // optional
    }
  }
}

export function getProjectId() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    'burgertime-48011'
  );
}
