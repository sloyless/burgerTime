/**
 * One-time backfill: set `slug` on burger docs that are missing it.
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_FIREBASE_PROJECT_ID (and other Firebase vars if needed)
 *   - Application Default Credentials, e.g. `gcloud auth application-default login`
 *     or GOOGLE_APPLICATION_CREDENTIALS pointing at a service account with Firestore write access
 *
 * Usage:
 *   node scripts/backfill-burger-slugs.mjs           # dry run (no writes)
 *   node scripts/backfill-burger-slugs.mjs --apply   # write slugs to Firestore
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

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
    // optional
  }
}

function slugifyPart(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function generateBurgerSlugBase(venue, burgerName, reviewDateYmd) {
  const base =
    slugifyPart(`${venue ?? ''}-${burgerName ?? ''}`) || 'burger-review';
  return `${base}-${reviewDateYmd}`;
}

function timestampToDateInputValue(timestamp) {
  if (!timestamp) return '';
  let seconds;
  if (typeof timestamp.seconds === 'number') {
    seconds = timestamp.seconds;
  } else if (typeof timestamp._seconds === 'number') {
    seconds = timestamp._seconds;
  } else if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else {
    return '';
  }
  const date = new Date(seconds * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function isSlugTaken(db, slug, excludeId) {
  const snap = await db
    .collection('burgers')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (snap.empty) return false;
  return snap.docs[0].id !== excludeId;
}

async function allocateSlug(db, data, docId) {
  const reviewDateYmd = timestampToDateInputValue(data.timestamp);
  if (!reviewDateYmd) {
    return null;
  }
  const base = generateBurgerSlugBase(
    data.venue,
    data.burgerName,
    reviewDateYmd
  );
  let candidate = base;
  let suffix = 2;
  while (await isSlugTaken(db, candidate, docId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function needsSlug(data) {
  const slug = data.slug;
  return typeof slug !== 'string' || slug.trim() === '';
}

loadEnvFile('.env.local');
loadEnvFile('.env.production');

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  'burgertime-48011';

if (!getApps().length) {
  initializeApp({ projectId });
}

const db = getFirestore();

const snapshot = await db.collection('burgers').get();
const pending = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  if (!needsSlug(data)) continue;

  const slug = await allocateSlug(db, data, doc.id);
  if (!slug) {
    console.warn(
      `skip ${doc.id}: no review date on timestamp (venue=${data.venue ?? '?'})`
    );
    continue;
  }
  pending.push({ id: doc.id, slug, venue: data.venue, burgerName: data.burgerName });
}

console.log(
  `${APPLY ? 'APPLY' : 'DRY RUN'}: ${pending.length} burgers need slug (of ${snapshot.size} total)`
);

for (const row of pending.slice(0, 20)) {
  console.log(`  ${row.id} → ${row.slug} (${row.venue} — ${row.burgerName})`);
}
if (pending.length > 20) {
  console.log(`  … and ${pending.length - 20} more`);
}

if (!APPLY || pending.length === 0) {
  if (!APPLY && pending.length > 0) {
    console.log('\nRe-run with --apply to write these slugs.');
  }
  process.exit(0);
}

const BATCH_SIZE = 400;
let written = 0;

for (let i = 0; i < pending.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = pending.slice(i, i + BATCH_SIZE);
  for (const { id, slug } of chunk) {
    batch.update(db.collection('burgers').doc(id), {
      slug,
      slugBackfilledAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  written += chunk.length;
  console.log(`Committed ${written}/${pending.length}`);
}

console.log('Done. Consider rebuilding meta/sitemap if you maintain those separately.');
