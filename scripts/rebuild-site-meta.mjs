/**
 * Rebuild meta/collectionSummary, meta/searchIndex, and meta/sitemap from all burgers.
 *
 * Prerequisites: same as backfill-burger-totals.mjs
 *
 * Usage:
 *   yarn rebuild:meta
 *
 * After deploy, run `yarn generate:sitemap` to refresh public/sitemap.xml.
 */
import {
  burgerFromDoc,
  fetchAllBurgers,
  getDb,
} from './lib/admin-init.mjs';
import { rebuildSiteMetaAdmin } from './lib/rebuild-site-meta.mjs';

getDb();
const docs = await fetchAllBurgers();
const burgers = docs.map(burgerFromDoc);

console.log(`Rebuilding site meta from ${burgers.length} burgers…`);

const stats = await rebuildSiteMetaAdmin(burgers);

console.log('Done.');
console.log(`  collectionSummary: ${stats.burgerCount} reviews aggregated`);
console.log(`  searchIndex: ${stats.searchChunks} chunk(s)`);
console.log(`  sitemap: ${stats.sitemapUrls} URL(s)`);
console.log('\nRun `yarn generate:sitemap` before deploy to sync public/sitemap.xml.');
