import {
  FieldValue,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';

import { getDisplayScore } from './scoring.mjs';

const CHUNK_MAX_ENTRIES = 250;
const STATIC_PATHS = [{ path: '/' }, { path: '/about' }];

function timestampSeconds(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.seconds === 'number') return timestamp.seconds;
  if (typeof timestamp._seconds === 'number') return timestamp._seconds;
  if (typeof timestamp.toDate === 'function') {
    return Math.floor(timestamp.toDate().getTime() / 1000);
  }
  return null;
}

function reviewYear(burger) {
  const seconds = timestampSeconds(burger.timestamp);
  if (seconds == null) return null;
  return new Date(seconds * 1000).getUTCFullYear();
}

function venueKey(venue) {
  const trimmed = venue?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function buildCollectionSummary(burgers) {
  const venueReviewCounts = {};
  const yearCounts = {};
  let sumScores = 0;
  let eliteCount = 0;

  for (const burger of burgers) {
    const key = venueKey(burger.venue);
    if (key) {
      venueReviewCounts[key] = (venueReviewCounts[key] ?? 0) + 1;
    }

    const year = reviewYear(burger);
    if (year != null) {
      const yearKey = String(year);
      yearCounts[yearKey] = (yearCounts[yearKey] ?? 0) + 1;
    }

    const score = getDisplayScore(burger);
    sumScores += score;
    if (score >= 90) eliteCount += 1;
  }

  return {
    version: 1,
    venueReviewCounts,
    yearCounts,
    sumScores,
    scoreCount: burgers.length,
    totalReviewCount: burgers.length,
    eliteCount,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function buildSearchIndexEntry(burger) {
  const seconds = timestampSeconds(burger.timestamp) ?? 0;
  const entry = {
    id: burger.id ?? '',
    timestampSeconds: seconds,
  };

  if (burger.slug) entry.slug = burger.slug;
  if (burger.venue) entry.venue = burger.venue;
  if (burger.burgerName) entry.burgerName = burger.burgerName;
  if (burger.address) entry.address = burger.address;
  if (burger.notes) entry.notes = burger.notes;
  if (burger.cookType) entry.cookType = burger.cookType;
  if (typeof burger.image === 'string') entry.image = burger.image;
  if (typeof burger.imageCard === 'string') entry.imageCard = burger.imageCard;
  if (burger.total != null) entry.total = burger.total;
  if (burger.appearance != null) entry.appearance = burger.appearance;
  if (burger.bun != null) entry.bun = burger.bun;
  if (burger.meat != null) entry.meat = burger.meat;
  if (burger.cheese != null) entry.cheese = burger.cheese;
  if (burger.veg != null) entry.veg = burger.veg;
  if (burger.sauce != null) entry.sauce = burger.sauce;
  if (burger.cheeseNA) entry.cheeseNA = true;
  if (burger.vegNA) entry.vegNA = true;
  if (burger.sauceNA) entry.sauceNA = true;

  return entry;
}

function getBurgerPath(burger) {
  if (!burger.id) return '/';
  if (burger.slug) return `/burger/${burger.slug}`;

  const seconds = timestampSeconds(burger.timestamp);
  if (seconds == null) return `/burger/${burger.id}`;

  const date = new Date(seconds * 1000);
  const ymd = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  const slug =
    burger.slug ||
    `${slugifyPart(`${burger.venue ?? ''}-${burger.burgerName ?? ''}`) || 'burger-review'}-${ymd}`;
  return `/burger/${slug}`;
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

function reviewLastmod(burger) {
  const seconds = timestampSeconds(burger.timestamp);
  if (seconds == null) return undefined;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function buildSitemapDoc(burgers) {
  const burgerUrls = burgers
    .map((burger) => {
      const path = getBurgerPath(burger);
      if (!path || path === '/') return null;
      return { path, lastmod: reviewLastmod(burger) };
    })
    .filter(Boolean);

  const urls = [...STATIC_PATHS, ...burgerUrls].sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  return {
    version: 1,
    urls,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function commitBatches(writes) {
  const db = getFirestore();
  const BATCH_LIMIT = 450;

  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const op of writes.slice(i, i + BATCH_LIMIT)) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data, op.options);
      } else if (op.type === 'delete') {
        batch.delete(op.ref);
      }
    }
    await batch.commit();
  }
}

/**
 * Rebuild meta/collectionSummary, meta/searchIndex (+ chunks), meta/sitemap.
 * @param {Array<Record<string, unknown> & { id: string }>} burgers
 */
export async function rebuildSiteMetaAdmin(burgers) {
  const db = getFirestore();

  await db.doc('meta/collectionSummary').set(buildCollectionSummary(burgers));

  const chunks = {};
  const chunkIds = [];
  const entryChunk = {};
  let chunkIndex = 0;
  let currentId = String(chunkIndex);
  chunks[currentId] = { entries: {} };
  chunkIds.push(currentId);

  for (const burger of burgers) {
    if (!burger.id) continue;
    const entry = buildSearchIndexEntry(burger);
    const keys = Object.keys(chunks[currentId].entries);
    if (keys.length >= CHUNK_MAX_ENTRIES) {
      chunkIndex += 1;
      currentId = String(chunkIndex);
      chunks[currentId] = { entries: {} };
      chunkIds.push(currentId);
    }
    chunks[currentId].entries[burger.id] = entry;
    entryChunk[burger.id] = currentId;
  }

  const manifest = {
    version: 1,
    chunkIds,
    entryChunk,
    updatedAt: Timestamp.now(),
  };

  const existingChunks = await db.collection('meta/searchIndex/chunks').get();
  const writes = [];

  writes.push({
    type: 'set',
    ref: db.doc('meta/searchIndex'),
    data: manifest,
  });

  for (const chunkSnap of existingChunks.docs) {
    if (!chunkIds.includes(chunkSnap.id)) {
      writes.push({ type: 'delete', ref: chunkSnap.ref });
    }
  }

  for (const [chunkId, body] of Object.entries(chunks)) {
    writes.push({
      type: 'set',
      ref: db.doc(`meta/searchIndex/chunks/${chunkId}`),
      data: body,
    });
  }

  await commitBatches(writes);

  const sitemapDoc = buildSitemapDoc(burgers);
  await db.doc('meta/sitemap').set(sitemapDoc);

  return {
    burgerCount: burgers.length,
    searchChunks: chunkIds.length,
    sitemapUrls: sitemapDoc.urls.length,
  };
}
