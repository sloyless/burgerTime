import {
  FieldPath,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

import type { BurgerCollectionStats } from 'libs/burgerStats';
import {
  encodeReviewPageCursor,
  type ReviewPageCursor,
} from 'libs/reviewPageCursor';
import { docToServerBurger, type ServerBurger } from 'utils/serverBurger';

import { getAdminFirestore } from './firebaseAdmin';

const BURGERS = 'burgers';
const SUMMARY_PATH = 'meta/collectionSummary';

type SummaryDoc = {
  eliteCount?: number;
  scoreCount?: number;
  sumScores?: number;
  totalReviewCount?: number;
  venueReviewCounts?: Record<string, number>;
  yearCounts?: Record<string, number>;
};

function summaryDocToStats(summary: SummaryDoc): BurgerCollectionStats {
  const currentYear = new Date().getUTCFullYear();
  const venueReviewCounts = summary.venueReviewCounts ?? {};
  const yearCounts = summary.yearCounts ?? {};

  let uniqueVenues = 0;
  for (const count of Object.values(venueReviewCounts)) {
    if (count > 0) uniqueVenues += 1;
  }

  const scoreCount = summary.scoreCount ?? 0;
  const averageScore =
    scoreCount > 0 ? (summary.sumScores ?? 0) / scoreCount : 0;

  let busiestYear: BurgerCollectionStats['busiestYear'] = null;
  for (const [yearKey, count] of Object.entries(yearCounts)) {
    const year = Number(yearKey);
    if (!busiestYear || count > busiestYear.count) {
      busiestYear = { year, count };
    }
  }

  return {
    uniqueVenues,
    averageScore,
    eliteCount: summary.eliteCount ?? 0,
    reviewsThisYear: yearCounts[String(currentYear)] ?? 0,
    busiestYear,
  };
}

function totalReviewCountFromSummary(summary: SummaryDoc): number {
  return summary.totalReviewCount ?? summary.scoreCount ?? 0;
}

function adminDocToServerBurger(
  id: string,
  data: DocumentData
): ServerBurger {
  return docToServerBurger(id, data);
}

function cursorFromSnapshot(
  snap: QueryDocumentSnapshot<DocumentData>
): ReviewPageCursor | null {
  const timestamp = snap.data().timestamp as
    | { seconds?: number; _seconds?: number }
    | undefined;
  const seconds = timestamp?.seconds ?? timestamp?._seconds;
  if (seconds == null) return null;
  return { timestampSeconds: seconds, documentId: snap.id };
}

async function fetchCollectionSummaryAdmin(): Promise<SummaryDoc | null> {
  const snap = await getAdminFirestore().doc(SUMMARY_PATH).get();
  if (!snap.exists) return null;
  return snap.data() as SummaryDoc;
}

async function fetchTopTenAdmin(): Promise<ServerBurger[]> {
  const snap = await getAdminFirestore()
    .collection(BURGERS)
    .orderBy('total', 'desc')
    .limit(10)
    .get();
  return snap.docs.map((doc) => adminDocToServerBurger(doc.id, doc.data()));
}

async function fetchLatestReviewsAdmin(
  pageSize: number,
  after?: ReviewPageCursor
): Promise<{ items: ServerBurger[]; nextPageCursor: ReviewPageCursor | null }> {
  const col = getAdminFirestore().collection(BURGERS);
  let query = col
    .orderBy('timestamp', 'desc')
    .orderBy(FieldPath.documentId(), 'desc')
    .limit(pageSize);

  if (after) {
    query = col
      .orderBy('timestamp', 'desc')
      .orderBy(FieldPath.documentId(), 'desc')
      .startAfter(
        Timestamp.fromMillis(after.timestampSeconds * 1000),
        after.documentId
      )
      .limit(pageSize);
  }

  const snap = await query.get();
  const items = snap.docs.map((doc) =>
    adminDocToServerBurger(doc.id, doc.data())
  );
  const last = snap.docs[snap.docs.length - 1];
  return {
    items,
    nextPageCursor: last ? cursorFromSnapshot(last) : null,
  };
}

async function fetchReviewCountAdmin(): Promise<number> {
  const snap = await getAdminFirestore().collection(BURGERS).count().get();
  return snap.data().count;
}

export type HomePageAdminData = {
  count: number;
  nextPageCursorEncoded: string | null;
  pageItems: ServerBurger[];
  stats: BurgerCollectionStats | null;
  topTen: ServerBurger[];
  totalPages: number;
};

/** Server-side home feed (page 1) for SSR/ISR — Admin SDK + ADC. */
export async function fetchHomePageAdmin(
  pageSize: number
): Promise<HomePageAdminData> {
  const [summary, topTen, pageResult] = await Promise.all([
    fetchCollectionSummaryAdmin(),
    fetchTopTenAdmin(),
    fetchLatestReviewsAdmin(pageSize),
  ]);

  const stats = summary ? summaryDocToStats(summary) : null;
  const count =
    summary != null
      ? totalReviewCountFromSummary(summary)
      : await fetchReviewCountAdmin();

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const nextPageCursorEncoded = pageResult.nextPageCursor
    ? encodeReviewPageCursor(pageResult.nextPageCursor)
    : null;

  return {
    count,
    nextPageCursorEncoded,
    pageItems: pageResult.items,
    stats,
    topTen,
    totalPages,
  };
}
