/**
 * Writes public/sitemap.xml from Firestore meta/sitemap (public read).
 * Run before `next build` / deploy so static hosting serves the sitemap.
 *
 * Requires NEXT_PUBLIC_FIREBASE_* vars (e.g. from .env.local).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, deleteApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filename) {
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
    // Optional .env.local
  }
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sitemapToXml(urls, origin) {
  const urlNodes = urls
    .map((item) => {
      const path = item.path.startsWith('/') ? item.path : `/${item.path}`;
      const loc = `${origin}${path}`;
      const lastmod = item.lastmod
        ? `\n    <lastmod>${item.lastmod}</lastmod>`
        : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
}

loadEnvFile('.env.local');
loadEnvFile('.env.production');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const origin = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://burgertime.app'
).replace(/\/$/, '');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const fallbackUrls = [{ path: '/' }, { path: '/about' }];
let urls = fallbackUrls;

try {
  const snap = await getDoc(doc(db, 'meta/sitemap'));
  if (snap.exists()) {
    urls = snap.data().urls ?? fallbackUrls;
  }
} catch (error) {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : 'unknown';
  console.warn(
    `Could not read meta/sitemap (${code}); writing fallback sitemap.`
  );
}

const xml = sitemapToXml(urls, origin);
const outPath = join(root, 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`Wrote ${outPath} (${urls.length} URLs)`);

await deleteApp(app);
