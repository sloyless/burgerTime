import {
  collection,
  doc,
  documentId,
  DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';

import { calculateScore } from 'functions';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
import {
  extractLegacyDocumentIdFromSlug,
  getCanonicalBurgerSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerSlug';

import {
  cacheBurgerDocId,
  getCachedBurgerDocId,
} from './burgerSlugResolveCache';
import {
  decodeReviewPageCursor,
  encodeReviewPageCursor,
  ReviewPageCursor,
} from './reviewPageCursor';
import {
  BurgerCollectionStats,
  computeBurgerCollectionStats,
} from './burgerStats';

const BURGERS_COLLECTION = 'burgers';

function docToBurger(docSnap: QueryDocumentSnapshot<DocumentData>): Burger {
  return {
    ...(docSnap.data() as Burger),
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

async function resolveStartCursor(
  page: number,
  pageSize: number,
  afterParam?: string
): Promise<ReviewPageCursor | undefined> {
  if (page <= 1) return undefined;

  const decoded = afterParam ? decodeReviewPageCursor(afterParam) : null;
  if (decoded) return decoded;

  let cursor: ReviewPageCursor | undefined;
  for (let p = 1; p < page; p++) {
    const { items, nextPageCursor } = await fetchLatestReviewsAfter(
      pageSize,
      cursor
    );
    if (!items.length) break;
    cursor = nextPageCursor ?? undefined;
  }

  return cursor;
}

export async function fetchLatestReviewsPage(
  page: number,
  pageSize: number,
  afterParam?: string
): Promise<LatestReviewsPageResult> {
  const safePage = Math.max(1, page);
  const startCursor = await resolveStartCursor(safePage, pageSize, afterParam);
  return fetchLatestReviewsAfter(pageSize, startCursor);
}

const ALL_BURGERS_PAGE_SIZE = 500;

/** Full collection read for aggregate stats (paginated by document id). */
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

export async function fetchTopTenBurgers(): Promise<Burger[]> {
  const burgers = await fetchAllBurgers();
  return burgers
    .slice()
    .sort((a, b) => calculateScore(b) - calculateScore(a))
    .slice(0, 10);
}

export type HomePageData = {
  count: number;
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
  afterParam?: string
): Promise<HomePageData> {
  const safePage = Math.max(1, page);

  const [count, topTen, pageResult, allBurgers] = await Promise.all([
    fetchBurgerReviewCount(),
    fetchTopTenBurgers(),
    fetchLatestReviewsPage(safePage, pageSize, afterParam),
    safePage === 1 ? fetchAllBurgers() : Promise.resolve(null),
  ]);

  const stats =
    allBurgers && allBurgers.length > 0
      ? computeBurgerCollectionStats(allBurgers)
      : null;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const nextPageCursor = pageResult.nextPageCursor;
  const nextPageCursorEncoded = nextPageCursor
    ? encodeReviewPageCursor(nextPageCursor)
    : null;

  return {
    count,
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

  if (typeof window === 'undefined') {
    return null;
  }

  /** Legacy docs without `slug` — prefer backfill; cap scan for safety. */
  const LEGACY_SLUG_SCAN_LIMIT = 300;
  const recentQuery = query(
    collection(database, BURGERS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(LEGACY_SLUG_SCAN_LIMIT)
  );
  const recentSnap = await getDocs(recentQuery);
  for (const docSnap of recentSnap.docs) {
    const burger = docToBurger(docSnap);
    if (
      burger.slug === urlSegment ||
      getCanonicalBurgerSlug(burger) === urlSegment
    ) {
      cacheBurgerDocId(urlSegment, docSnap.id);
      return docSnap.id;
    }
  }

  return null;
}
