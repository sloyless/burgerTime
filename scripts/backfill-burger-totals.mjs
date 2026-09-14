/**
 * Recompute stored `total` on every burger from current score weights.
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   - Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS
 *
 * Usage:
 *   yarn backfill:totals              # dry run
 *   yarn backfill:totals -- --apply   # write to Firestore
 */
import { getDb, fetchAllBurgers, burgerFromDoc } from './lib/admin-init.mjs';
import { calculateScore } from './lib/scoring.mjs';

const APPLY = process.argv.includes('--apply');

getDb();
const docs = await fetchAllBurgers();
const updates = [];

for (const doc of docs) {
  const burger = burgerFromDoc(doc);
  const nextTotal = calculateScore(burger);
  const prevTotal = doc.data.total;
  if (prevTotal === nextTotal) continue;
  updates.push({ id: doc.id, prevTotal, nextTotal });
}

console.log(`Scanned ${docs.length} burgers; ${updates.length} need total updates.`);

if (updates.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

const sample = updates.slice(0, 10);
for (const row of sample) {
  console.log(`  ${row.id}: ${row.prevTotal ?? '(missing)'} → ${row.nextTotal}`);
}
if (updates.length > sample.length) {
  console.log(`  … and ${updates.length - sample.length} more`);
}

if (!APPLY) {
  console.log('\nDry run. Pass --apply to write changes.');
  process.exit(0);
}

const db = getDb();
const BATCH_LIMIT = 450;
let written = 0;

for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
  const batch = db.batch();
  for (const row of updates.slice(i, i + BATCH_LIMIT)) {
    batch.update(db.collection('burgers').doc(row.id), { total: row.nextTotal });
  }
  await batch.commit();
  written += Math.min(BATCH_LIMIT, updates.length - i);
}

console.log(`Updated total on ${written} documents.`);
