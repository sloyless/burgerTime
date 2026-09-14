import {
  collection,
  doc,
  documentId,
  type DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';

import { database } from 'utils/firebase';
import type { Burger } from 'utils/types';
import {
  extractLegacyDocumentIdFromSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerSlug';

import {
  cacheBurgerDocId,
  getCachedBurgerDocId,
} from './burgerSlugResolveCache';
import { burgerMatchesUrlSegment } from './burgerMatchesUrlSegment';
import {
  decodeReviewPageCursor,
  encodeReviewPageCursor,
  type ReviewPageCursor,
} from './reviewPageCursor';
import {
  fetchCollectionSummaryDoc,
  summaryDocToStats,
  totalReviewCountFromSummary,
} from './collectionSummary';
import {
  buildSearchIndexEntry,
  burgerSearchHaystack,
  fetchSearchIndexEntries,
  searchEntryToBurger,
} from './searchIndex';
import type { BurgerCollectionStats } from './burgerStats';

const BURGERS_COLLECTION = 'burgers';

function docToBurger(docSnap: QueryDocumentSnapshot<DocumentData>): Burger {
  const data = docSnap.data() as Burger;
  return {
    ...data,
    id: docSnap.id,
  };
}

function cursorFromSnapshot(
  docSnap: QueryDocumentSnapshot<DocumentData>
): ReviewPageCursor | null {
  const timestamp = docSnap.data().timestamp as
    { seconds?: number } | undefined;
  if (timestamp?.seconds == null) return null;

  return {
    timestampSeconds: timestamp.seconds,
    documentId: docSnap.id,
  };
}

export async function fetchBurgerReviewCount(): Promise<number> {
  const snapshot = await getCountFromServer(
    collection(database, BURGERS_COLLECTION)
  );
  return snapshot.data().count;
}

export type LatestReviewsPageResult = {
  items: Burger[];
  /** Cursor to pass when requesting the next page (after the last item on this page). */
  nextPageCursor: ReviewPageCursor | null;
};

/** One page of latest reviews (fixed read size = pageSize). */
export async function fetchLatestReviewsAfter(
  pageSize: number,
  after?: ReviewPageCursor
): Promise<LatestReviewsPageResult> {
  const col = collection(database, BURGERS_COLLECTION);

  const snapshot = await getDocs(
    after
      ? query(
          col,
          orderBy('timestamp', 'desc'),
          orderBy(documentId(), 'desc'),
          startAfter(
            Timestamp.fromMillis(after.timestampSeconds * 1000),
            after.documentId
          ),
          limit(pageSize)
        )
      : query(
          col,
          orderBy('timestamp', 'desc'),
          orderBy(documentId(), 'desc'),
          limit(pageSize)
        )
  );

  const items = snapshot.docs.map(docToBurger);
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return {
    items,
    nextPageCursor: lastDoc ? cursorFromSnapshot(lastDoc) : null,
  };
}

export type ResolvePageCursorResult = {
  discoveredCursors: Map<number, string>;
  startCursor: ReviewPageCursor | undefined;
};

function encodedCursorForPage(
  page: number,
  afterParam?: string,
  storedCursors?: Map<number, string>
): string | undefined {
  if (page <= 1) return undefined;
  if (afterParam) return afterParam;
  return storedCursors?.get(page);
}

/** Resolves start cursor from URL `after` or stored cursors (no multi-page Firestore walk). */
export function resolveReviewPageStartCursor(
  page: number,
  _pageSize: number,
  options?: {
    afterParam?: string;
    storedCursors?: Map<number, string>;
  }
): ResolvePageCursorResult {
  const discoveredCursors = new Map<number, string>();

  if (page <= 1) {
    return { startCursor: undefined, discoveredCursors };
  }

  const encoded = encodedCursorForPage(
    page,
    options?.afterParam,
    options?.storedCursors
  );
  if (encoded) {
    const decoded = decodeReviewPageCursor(encoded);
    if (decoded) {
      return { startCursor: decoded, discoveredCursors };
    }
  }

  return { startCursor: undefined, discoveredCursors };
}

export async function fetchLatestReviewsPage(
  page: number,
  pageSize: number,
  options?: {
    afterParam?: string;
    storedCursors?: Map<number, string>;
  }
): Promise<LatestReviewsPageResult & ResolvePageCursorResult> {
  const safePage = Math.max(1, page);
  const { startCursor, discoveredCursors } = resolveReviewPageStartCursor(
    safePage,
    pageSize,
    options
  );
  const pageResult = await fetchLatestReviewsAfter(pageSize, startCursor);
  return { ...pageResult, discoveredCursors, startCursor };
}

const ALL_BURGERS_PAGE_SIZE = 500;

/** Paginated full collection read (search, admin tools). */
export async function fetchAllBurgers(): Promise<Burger[]> {
  const col = collection(database, BURGERS_COLLECTION);
  const items: Burger[] = [];
  let lastDoc: QueryDocumentSnapshot<DocumentData> | undefined;

  while (true) {
    const snapshot = await getDocs(
      lastDoc
        ? query(
            col,
            orderBy(documentId()),
            startAfter(lastDoc),
            limit(ALL_BURGERS_PAGE_SIZE)
          )
        : query(col, orderBy(documentId()), limit(ALL_BURGERS_PAGE_SIZE))
    );

    if (snapshot.empty) break;

    items.push(...snapshot.docs.map(docToBurger));
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.docs.length < ALL_BURGERS_PAGE_SIZE) break;
  }

  return items;
}

/** Case-insensitive search across venue, burger name, location, notes, and cook type. */
export async function searchBurgers(term: string): Promise<Burger[]> {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  let indexEntries = await fetchSearchIndexEntries();

  if (indexEntries.length === 0) {
    const all = await fetchAllBurgers();
    indexEntries = all.map((burger) => buildSearchIndexEntry(burger));
  }

  return indexEntries
    .filter((entry) => {
      const haystack = burgerSearchHaystack(entry);
      return tokens.every((token) => haystack.includes(token));
    })
    .sort((a, b) => b.timestampSeconds - a.timestampSeconds)
    .map(searchEntryToBurger);
}

/** Top burgers by stored `total` (kept in sync on save). */
export async function fetchTopTenBurgers(): Promise<Burger[]> {
  const snapshot = await getDocs(
    query(
      collection(database, BURGERS_COLLECTION),
      orderBy('total', 'desc'),
      limit(10)
    )
  );
  return snapshot.docs.map(docToBurger);
}

export type HomePageData = {
  count: number;
  discoveredCursors: Map<number, string>;
  nextPageCursor: ReviewPageCursor | null;
  nextPageCursorEncoded: string | null;
  pageItems: Burger[];
  stats: BurgerCollectionStats | null;
  topTen: Burger[];
  totalPages: number;
};

export async function fetchHomePageData(
  page: number,
  pageSize: number,
  options?: {
    afterParam?: string;
    storedCursors?: Map<number, string>;
  }
): Promise<HomePageData> {
  const safePage = Math.max(1, page);

  const [summary, topTen, pageResult] = await Promise.all([
    fetchCollectionSummaryDoc(),
    fetchTopTenBurgers(),
    fetchLatestReviewsPage(safePage, pageSize, options),
  ]);

  const stats = summary ? summaryDocToStats(summary) : null;
  const count =
    summary != null
      ? totalReviewCountFromSummary(summary)
      : await fetchBurgerReviewCount();

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const nextPageCursor = pageResult.nextPageCursor;
  const nextPageCursorEncoded = nextPageCursor
    ? encodeReviewPageCursor(nextPageCursor)
    : null;

  const discoveredCursors = new Map(pageResult.discoveredCursors);
  if (nextPageCursorEncoded && safePage < totalPages) {
    discoveredCursors.set(safePage + 1, nextPageCursorEncoded);
  }

  return {
    count,
    discoveredCursors,
    topTen,
    pageItems: pageResult.items,
    stats,
    totalPages,
    nextPageCursor,
    nextPageCursorEncoded,
  };
}

/** Resolve a burger detail URL segment to a Firestore document id. */
export async function resolveBurgerDocumentId(
  urlSegment: string
): Promise<string | null> {
  const cachedId = getCachedBurgerDocId(urlSegment);
  if (cachedId) {
    const cachedSnap = await getDoc(
      doc(database, BURGERS_COLLECTION, cachedId)
    );
    if (cachedSnap.exists()) {
      return cachedId;
    }
  }

  if (looksLikeFirestoreDocumentId(urlSegment)) {
    const snap = await getDoc(doc(database, BURGERS_COLLECTION, urlSegment));
    if (snap.exists()) {
      cacheBurgerDocId(urlSegment, urlSegment);
      return urlSegment;
    }
    return null;
  }

  const legacyId = extractLegacyDocumentIdFromSlug(urlSegment);
  if (legacyId && legacyId !== urlSegment) {
    const legacySnap = await getDoc(
      doc(database, BURGERS_COLLECTION, legacyId)
    );
    if (legacySnap.exists()) {
      cacheBurgerDocId(urlSegment, legacyId);
      return legacyId;
    }
  }

  const slugQuery = query(
    collection(database, BURGERS_COLLECTION),
    where('slug', '==', urlSegment),
    limit(1)
  );
  const slugSnap = await getDocs(slugQuery);
  if (!slugSnap.empty) {
    const id = slugSnap.docs[0].id;
    cacheBurgerDocId(urlSegment, id);
    return id;
  }

  /** Legacy docs without `slug` — match computed canonical URL segment. */
  const LEGACY_SLUG_SCAN_LIMIT = 500;
  const recentQuery = query(
    collection(database, BURGERS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(LEGACY_SLUG_SCAN_LIMIT)
  );
  const recentSnap = await getDocs(recentQuery);
  for (const docSnap of recentSnap.docs) {
    const burger = docToBurger(docSnap);
    if (burgerMatchesUrlSegment(burger, urlSegment)) {
      cacheBurgerDocId(urlSegment, docSnap.id);
      return docSnap.id;
    }
  }

  return null;
}
