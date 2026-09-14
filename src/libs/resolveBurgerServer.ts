import type { IncomingMessage } from 'http';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import {
  extractLegacyDocumentIdFromSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerUrlSegment';
import { getServerFirestore } from 'utils/firebaseServer';
import { docToServerBurger, type ServerBurger } from 'utils/serverBurger';

const BURGERS_COLLECTION = 'burgers';

function isFirebaseManagedServerRuntime(): boolean {
  return Boolean(
    process.env.K_SERVICE ||
    process.env.FUNCTION_TARGET ||
    process.env.FIREBASE_CONFIG
  );
}

async function resolveBurgerByUrlSegmentClient(
  urlSegment: string,
  req: IncomingMessage
): Promise<ServerBurger | null> {
  const db = getServerFirestore(req);

  if (looksLikeFirestoreDocumentId(urlSegment)) {
    const snap = await getDoc(doc(db, BURGERS_COLLECTION, urlSegment));
    return snap.exists() ? docToServerBurger(snap.id, snap.data()) : null;
  }

  const legacyId = extractLegacyDocumentIdFromSlug(urlSegment);
  if (legacyId && legacyId !== urlSegment) {
    const legacySnap = await getDoc(doc(db, BURGERS_COLLECTION, legacyId));
    if (legacySnap.exists()) {
      return docToServerBurger(legacySnap.id, legacySnap.data());
    }
  }

  const slugSnap = await getDocs(
    query(
      collection(db, BURGERS_COLLECTION),
      where('slug', '==', urlSegment),
      limit(1)
    )
  );

  if (!slugSnap.empty) {
    const match = slugSnap.docs[0];
    return docToServerBurger(match.id, match.data());
  }

  return null;
}

/** Pages Router: call only from `getServerSideProps`. */
export async function resolveBurgerByUrlSegment(
  urlSegment: string,
  req: IncomingMessage
): Promise<ServerBurger | null> {
  if (isFirebaseManagedServerRuntime()) {
    const { resolveBurgerByUrlSegmentAdmin } =
      await import('./resolveBurgerAdmin');
    return resolveBurgerByUrlSegmentAdmin(urlSegment);
  }

  return resolveBurgerByUrlSegmentClient(urlSegment, req);
}
