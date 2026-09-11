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

import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
import {
  extractLegacyDocumentIdFromSlug,
  getCanonicalBurgerSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerSlug';

import {
  decodeReviewPageCursor,
  encodeReviewPageCursor,
  ReviewPageCursor,
} from './reviewPageCursor';

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
  nextPageCursor: ReviewPageCursor | null;
  nextPageCursorEncoded: string | null;
  pageItems: Burger[];
  topTen: Burger[];
  totalPages: number;
};

export async function fetchHomePageData(
  page: number,
  pageSize: number,
  afterParam?: string
): Promise<HomePageData> {
  const safePage = Math.max(1, page);

  const [count, topTen, pageResult] = await Promise.all([
    fetchBurgerReviewCount(),
    fetchTopTenBurgers(),
    fetchLatestReviewsPage(safePage, pageSize, afterParam),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const nextPageCursor = pageResult.nextPageCursor;
  const nextPageCursorEncoded = nextPageCursor
    ? encodeReviewPageCursor(nextPageCursor)
    : null;

  return {
    count,
    topTen,
    pageItems: pageResult.items,
    totalPages,
    nextPageCursor,
    nextPageCursorEncoded,
  };
}

/** Resolve a burger detail URL segment to a Firestore document id. */
export async function resolveBurgerDocumentId(
  urlSegment: string
): Promise<string | null> {
  if (looksLikeFirestoreDocumentId(urlSegment)) {
    const snap = await getDoc(doc(database, BURGERS_COLLECTION, urlSegment));
    return snap.exists() ? urlSegment : null;
  }

  const legacyId = extractLegacyDocumentIdFromSlug(urlSegment);
  if (legacyId && legacyId !== urlSegment) {
    const legacySnap = await getDoc(
      doc(database, BURGERS_COLLECTION, legacyId)
    );
    if (legacySnap.exists()) {
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
    return slugSnap.docs[0].id;
  }

  const allSnap = await getDocs(collection(database, BURGERS_COLLECTION));
  for (const docSnap of allSnap.docs) {
    const burger = docToBurger(docSnap);
    if (
      burger.slug === urlSegment ||
      getCanonicalBurgerSlug(burger) === urlSegment
    ) {
      return docSnap.id;
    }
  }

  return null;
}
