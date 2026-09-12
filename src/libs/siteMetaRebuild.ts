import {
  collection,
  doc,
  documentId,
  type DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  startAfter,
} from 'firebase/firestore';

import { rebuildCollectionSummaryFromBurgers } from 'libs/collectionSummary';
import { rebuildSearchIndex } from 'libs/searchIndex';
import { rebuildSitemap } from 'libs/sitemap';
import { database } from 'utils/firebase';
import type { Burger } from 'utils/types';

const BURGERS_COLLECTION = 'burgers';
const SUMMARY_DOC_PATH = 'meta/collectionSummary';
const SEARCH_MANIFEST_PATH = 'meta/searchIndex';
const SITEMAP_DOC_PATH = 'meta/sitemap';
const REBUILD_PAGE_SIZE = 500;

function docToBurger(docSnap: QueryDocumentSnapshot<DocumentData>): Burger {
  const data = docSnap.data() as Burger;
  return { ...data, id: docSnap.id };
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

/** Rebuild summary, search index, and sitemap (admin writes). */
export async function rebuildSiteMeta(): Promise<void> {
  const burgers = await fetchAllBurgersForRebuild();
  await Promise.all([
    rebuildCollectionSummaryFromBurgers(burgers),
    rebuildSearchIndex(burgers),
    rebuildSitemap(burgers),
  ]);
}

export async function ensureSiteMeta(): Promise<void> {
  const [summarySnap, indexSnap, sitemapSnap] = await Promise.all([
    getDoc(doc(database, SUMMARY_DOC_PATH)),
    getDoc(doc(database, SEARCH_MANIFEST_PATH)),
    getDoc(doc(database, SITEMAP_DOC_PATH)),
  ]);

  if (summarySnap.exists() && indexSnap.exists() && sitemapSnap.exists()) {
    return;
  }

  await rebuildSiteMeta();
}
