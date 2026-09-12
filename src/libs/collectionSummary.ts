import {
  collection,
  doc,
  documentId,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  startAfter,
  Timestamp,
} from 'firebase/firestore';

import { calculateTimestamp, getDisplayScore } from 'functions';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';

import { BurgerCollectionStats } from './burgerStats';

const BURGERS_COLLECTION = 'burgers';
const SUMMARY_DOC_PATH = 'meta/collectionSummary';
const REBUILD_PAGE_SIZE = 500;

export type CollectionSummaryDoc = {
  eliteCount: number;
  scoreCount: number;
  sumScores: number;
  venueReviewCounts: Record<string, number>;
  yearCounts: Record<string, number>;
  updatedAt: Timestamp;
  version: 1;
};

function docToBurger(docSnap: QueryDocumentSnapshot<DocumentData>): Burger {
  const data = docSnap.data() as Burger;
  return { ...data, id: docSnap.id };
}

function venueKey(venue: string | undefined): string | null {
  const trimmed = venue?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function reviewYear(burger: Burger): number | null {
  const seconds = (burger.timestamp as { seconds?: number } | undefined)
    ?.seconds;
  if (seconds == null) return null;
  const date = calculateTimestamp(seconds);
  return date ? date.getUTCFullYear() : null;
}

function emptySummary(): CollectionSummaryDoc {
  return {
    version: 1,
    venueReviewCounts: {},
    sumScores: 0,
    scoreCount: 0,
    eliteCount: 0,
    yearCounts: {},
    updatedAt: Timestamp.now(),
  };
}

export function summaryDocToStats(
  summary: CollectionSummaryDoc
): BurgerCollectionStats {
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

function bumpVenue(
  counts: Record<string, number>,
  key: string | null,
  delta: number
) {
  if (!key) return;
  const next = (counts[key] ?? 0) + delta;
  if (next <= 0) {
    delete counts[key];
  } else {
    counts[key] = next;
  }
}

function bumpYear(
  counts: Record<string, number>,
  year: number | null,
  delta: number
) {
  if (year == null) return;
  const key = String(year);
  const next = (counts[key] ?? 0) + delta;
  if (next <= 0) {
    delete counts[key];
  } else {
    counts[key] = next;
  }
}

function applyScoreDelta(
  summary: CollectionSummaryDoc,
  score: number,
  delta: number
) {
  summary.sumScores += score * delta;
  summary.scoreCount += delta;
  if (score >= 90) {
    summary.eliteCount += delta;
  }
}

function applyBurgerCreate(summary: CollectionSummaryDoc, burger: Burger) {
  bumpVenue(summary.venueReviewCounts, venueKey(burger.venue), 1);
  bumpYear(summary.yearCounts, reviewYear(burger), 1);
  applyScoreDelta(summary, getDisplayScore(burger), 1);
}

function applyBurgerRemove(summary: CollectionSummaryDoc, burger: Burger) {
  bumpVenue(summary.venueReviewCounts, venueKey(burger.venue), -1);
  bumpYear(summary.yearCounts, reviewYear(burger), -1);
  applyScoreDelta(summary, getDisplayScore(burger), -1);
}

async function fetchAllBurgersForRebuild(): Promise<Burger[]> {
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
            limit(REBUILD_PAGE_SIZE)
          )
        : query(col, orderBy(documentId()), limit(REBUILD_PAGE_SIZE))
    );

    if (snapshot.empty) break;

    items.push(...snapshot.docs.map(docToBurger));
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.docs.length < REBUILD_PAGE_SIZE) break;
  }

  return items;
}

export async function rebuildCollectionSummary(): Promise<CollectionSummaryDoc> {
  const burgers = await fetchAllBurgersForRebuild();

  const venueReviewCounts: Record<string, number> = {};
  const yearCounts: Record<string, number> = {};
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

  const docBody: CollectionSummaryDoc = {
    version: 1,
    venueReviewCounts,
    yearCounts,
    sumScores,
    scoreCount: burgers.length,
    eliteCount,
    updatedAt: Timestamp.now(),
  };

  const ref = doc(database, SUMMARY_DOC_PATH);
  await runTransaction(database, async (transaction) => {
    transaction.set(ref, docBody);
  });

  return docBody;
}

export async function fetchCollectionStats(): Promise<BurgerCollectionStats | null> {
  const snap = await getDoc(doc(database, SUMMARY_DOC_PATH));
  if (!snap.exists()) return null;
  return summaryDocToStats(snap.data() as CollectionSummaryDoc);
}

export async function syncCollectionSummaryAfterCreate(
  burger: Burger
): Promise<void> {
  const ref = doc(database, SUMMARY_DOC_PATH);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await rebuildCollectionSummary();
    return;
  }

  try {
    await runTransaction(database, async (transaction) => {
      const snap = await transaction.get(ref);
      const summary = snap.exists()
        ? { ...(snap.data() as CollectionSummaryDoc) }
        : emptySummary();

      applyBurgerCreate(summary, burger);
      summary.updatedAt = Timestamp.now();
      transaction.set(ref, summary);
    });
  } catch (error) {
    console.error('Collection summary create sync failed, rebuilding:', error);
    await rebuildCollectionSummary();
  }
}

export async function syncCollectionSummaryAfterUpdate(
  before: Burger,
  after: Burger
): Promise<void> {
  const ref = doc(database, SUMMARY_DOC_PATH);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await rebuildCollectionSummary();
    return;
  }

  try {
    await runTransaction(database, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        return;
      }

      const summary = { ...(snap.data() as CollectionSummaryDoc) };
      applyBurgerRemove(summary, before);
      applyBurgerCreate(summary, after);
      summary.updatedAt = Timestamp.now();
      transaction.set(ref, summary);
    });
  } catch (error) {
    console.error('Collection summary update sync failed, rebuilding:', error);
    await rebuildCollectionSummary();
  }
}

/** One-shot backfill when summary doc is missing (e.g. after deploy). */
export async function ensureCollectionSummary(): Promise<void> {
  const snap = await getDoc(doc(database, SUMMARY_DOC_PATH));
  if (snap.exists()) return;
  await rebuildCollectionSummary();
}
