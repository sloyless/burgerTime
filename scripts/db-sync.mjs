/**
 * Recompute burger `total` fields, then rebuild Firestore meta docs.
 *
 * Usage:
 *   yarn db:sync              # dry run (totals only; meta not written)
 *   yarn db:sync -- --apply     # update totals + rebuild meta
 */
import {
  burgerFromDoc,
  fetchAllBurgers,
  getDb,
} from './lib/admin-init.mjs';
import { rebuildSiteMetaAdmin } from './lib/rebuild-site-meta.mjs';
import { calculateScore } from './lib/scoring.mjs';

const APPLY = process.argv.includes('--apply');

getDb();
const docs = await fetchAllBurgers();
const totalUpdates = [];

for (const doc of docs) {
  const burger = burgerFromDoc(doc);
  const nextTotal = calculateScore(burger);
  if (doc.data.total === nextTotal) continue;
  totalUpdates.push({ id: doc.id, nextTotal });
}

console.log(
  `Scanned ${docs.length} burgers; ${totalUpdates.length} total field update(s).`
);

if (!APPLY) {
  console.log('Dry run. Pass --apply to write totals and rebuild meta.');
  process.exit(0);
}

if (totalUpdates.length > 0) {
  const db = getDb();
  const BATCH_LIMIT = 450;
  for (let i = 0; i < totalUpdates.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const row of totalUpdates.slice(i, i + BATCH_LIMIT)) {
      batch.update(db.collection('burgers').doc(row.id), {
        total: row.nextTotal,
      });
    }
    await batch.commit();
  }
  console.log(`Updated total on ${totalUpdates.length} document(s).`);
}

const burgers = docs.map((doc) => {
  const burger = burgerFromDoc(doc);
  const patch = totalUpdates.find((row) => row.id === doc.id);
  if (patch) burger.total = patch.nextTotal;
  return burger;
});

console.log('Rebuilding meta docs…');
const stats = await rebuildSiteMetaAdmin(burgers);
console.log('Done.');
console.log(`  searchIndex: ${stats.searchChunks} chunk(s)`);
console.log(`  sitemap: ${stats.sitemapUrls} URL(s)`);
console.log('\nRun `yarn generate:sitemap` before deploy to sync public/sitemap.xml.');
