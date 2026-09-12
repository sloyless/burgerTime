import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';

import { database } from 'utils/firebase';
import type { Burger } from 'utils/types';

const MANIFEST_PATH = 'meta/searchIndex';
const CHUNK_MAX_ENTRIES = 250;
const CACHE_STORAGE_KEY = 'burgertime-search-index-v1';

export type SearchIndexEntry = {
  id: string;
  slug?: string;
  venue?: string;
  burgerName?: string;
  address?: string;
  notes?: string;
  cookType?: string;
  timestampSeconds: number;
  image?: string;
  total?: number;
};

type SearchIndexManifest = {
  version: 1;
  chunkIds: string[];
  entryChunk: Record<string, string>;
  updatedAt: Timestamp;
};

type SearchIndexChunkDoc = {
  entries: Record<string, SearchIndexEntry>;
};

type CachedSearchIndex = {
  updatedAtMs: number;
  entries: SearchIndexEntry[];
};

export function burgerSearchHaystack(entry: SearchIndexEntry): string {
  return [
    entry.venue,
    entry.burgerName,
    entry.address,
    entry.notes,
    entry.cookType,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function searchEntryToBurger(entry: SearchIndexEntry): Burger {
  return {
    id: entry.id,
    slug: entry.slug,
    venue: entry.venue,
    burgerName: entry.burgerName,
    address: entry.address,
    image: entry.image,
    total: entry.total,
    timestamp: {
      seconds: entry.timestampSeconds,
    } as unknown as Burger['timestamp'],
  };
}

export function buildSearchIndexEntry(burger: Burger): SearchIndexEntry {
  const seconds =
    (burger.timestamp as { seconds?: number } | undefined)?.seconds ?? 0;

  return {
    id: burger.id ?? '',
    slug: burger.slug,
    venue: burger.venue,
    burgerName: burger.burgerName,
    address: burger.address,
    notes: burger.notes,
    cookType: burger.cookType,
    timestampSeconds: seconds,
    image:
      burger.image && typeof burger.image === 'string'
        ? burger.image
        : undefined,
    total: burger.total,
  };
}

function readSessionCache(): CachedSearchIndex | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSearchIndex;
  } catch {
    return null;
  }
}

function writeSessionCache(entries: SearchIndexEntry[], updatedAtMs: number) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify({ updatedAtMs, entries })
    );
  } catch {
    // Quota or private mode — ignore.
  }
}

async function fetchManifest(): Promise<SearchIndexManifest | null> {
  const snap = await getDoc(doc(database, MANIFEST_PATH));
  if (!snap.exists()) return null;
  return snap.data() as SearchIndexManifest;
}

function chunkIdForIndex(index: number): string {
  return String(index);
}

function chunkDocRef(chunkId: string) {
  return doc(database, 'meta', 'searchIndex', 'chunks', chunkId);
}

function chunksCollectionRef() {
  return collection(database, 'meta', 'searchIndex', 'chunks');
}

async function fetchEntriesFromChunks(
  manifest: SearchIndexManifest
): Promise<SearchIndexEntry[]> {
  const entries: SearchIndexEntry[] = [];

  for (const chunkId of manifest.chunkIds) {
    const chunkSnap = await getDoc(chunkDocRef(chunkId));
    if (!chunkSnap.exists()) continue;
    const chunk = chunkSnap.data() as SearchIndexChunkDoc;
    entries.push(...Object.values(chunk.entries ?? {}));
  }

  return entries;
}

/** Load compact search rows (cached per manifest `updatedAt`). */
export async function fetchSearchIndexEntries(): Promise<SearchIndexEntry[]> {
  const manifest = await fetchManifest();
  if (!manifest) return [];

  const updatedAtMs = manifest.updatedAt.toMillis();
  const cached = readSessionCache();
  if (cached && cached.updatedAtMs === updatedAtMs) {
    return cached.entries;
  }

  const entries = await fetchEntriesFromChunks(manifest);
  writeSessionCache(entries, updatedAtMs);
  return entries;
}

export async function rebuildSearchIndex(burgers: Burger[]): Promise<void> {
  const chunks: Record<string, SearchIndexChunkDoc> = {};
  const chunkIds: string[] = [];
  const entryChunk: Record<string, string> = {};

  let chunkIndex = 0;
  let currentId = chunkIdForIndex(chunkIndex);
  chunks[currentId] = { entries: {} };
  chunkIds.push(currentId);

  for (const burger of burgers) {
    if (!burger.id) continue;
    const entry = buildSearchIndexEntry(burger);
    const keys = Object.keys(chunks[currentId].entries);
    if (keys.length >= CHUNK_MAX_ENTRIES) {
      chunkIndex += 1;
      currentId = chunkIdForIndex(chunkIndex);
      chunks[currentId] = { entries: {} };
      chunkIds.push(currentId);
    }
    chunks[currentId].entries[burger.id] = entry;
    entryChunk[burger.id] = currentId;
  }

  const manifest: SearchIndexManifest = {
    version: 1,
    chunkIds,
    entryChunk,
    updatedAt: Timestamp.now(),
  };

  const batch = writeBatch(database);
  batch.set(doc(database, MANIFEST_PATH), manifest);

  const existingChunks = await getDocs(chunksCollectionRef());
  for (const chunkSnap of existingChunks.docs) {
    if (!chunkIds.includes(chunkSnap.id)) {
      batch.delete(chunkSnap.ref);
    }
  }

  for (const [chunkId, body] of Object.entries(chunks)) {
    batch.set(chunkDocRef(chunkId), body);
  }

  await batch.commit();
}

async function upsertSearchIndexEntry(burger: Burger): Promise<void> {
  const burgerId = burger.id;
  if (!burgerId) return;
  const entry = buildSearchIndexEntry(burger);
  const manifestRef = doc(database, MANIFEST_PATH);

  await runTransaction(database, async (transaction) => {
    const manifestSnap = await transaction.get(manifestRef);
    if (!manifestSnap.exists()) {
      return;
    }

    const manifest = manifestSnap.data() as SearchIndexManifest;
    let chunkId = manifest.entryChunk[burgerId];

    if (!chunkId) {
      const lastChunkId =
        manifest.chunkIds[manifest.chunkIds.length - 1] ?? chunkIdForIndex(0);
      const lastChunkRef = chunkDocRef(lastChunkId);
      const lastChunkSnap = await transaction.get(lastChunkRef);
      const lastEntries = lastChunkSnap.exists()
        ? ((lastChunkSnap.data() as SearchIndexChunkDoc).entries ?? {})
        : {};

      if (Object.keys(lastEntries).length >= CHUNK_MAX_ENTRIES) {
        const nextIndex = manifest.chunkIds.length;
        chunkId = chunkIdForIndex(nextIndex);
        manifest.chunkIds.push(chunkId);
        transaction.set(chunkDocRef(chunkId), {
          entries: { [burgerId]: entry },
        });
      } else {
        chunkId = lastChunkId;
        if (!manifest.chunkIds.includes(chunkId)) {
          manifest.chunkIds.push(chunkId);
        }
        transaction.set(
          lastChunkRef,
          { entries: { ...lastEntries, [burgerId]: entry } },
          { merge: true }
        );
      }

      manifest.entryChunk[burgerId] = chunkId;
    } else {
      const chunkRef = chunkDocRef(chunkId);
      const chunkSnap = await transaction.get(chunkRef);
      const entries = chunkSnap.exists()
        ? ((chunkSnap.data() as SearchIndexChunkDoc).entries ?? {})
        : {};
      transaction.set(chunkRef, {
        entries: { ...entries, [burgerId]: entry },
      });
    }

    manifest.updatedAt = Timestamp.now();
    transaction.set(manifestRef, manifest);
  });
}

async function ensureSearchIndexReady(): Promise<boolean> {
  const manifest = await fetchManifest();
  if (manifest) return true;

  const summary = await getDoc(doc(database, 'meta', 'collectionSummary'));
  if (!summary.exists()) return false;

  const { rebuildSiteMeta } = await import('libs/siteMetaRebuild');
  await rebuildSiteMeta();
  return true;
}

export async function syncSearchIndexAfterCreate(
  burger: Burger
): Promise<void> {
  try {
    if (!(await ensureSearchIndexReady())) return;
    await upsertSearchIndexEntry(burger);
  } catch (error) {
    console.error('Search index create sync failed:', error);
  }
}

export async function syncSearchIndexAfterUpdate(after: Burger): Promise<void> {
  try {
    if (!(await ensureSearchIndexReady())) return;
    await upsertSearchIndexEntry(after);
  } catch (error) {
    console.error('Search index update sync failed:', error);
  }
}
