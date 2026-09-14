import type { DocumentData } from 'firebase-admin/firestore';

import {
  extractLegacyDocumentIdFromSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerUrlSegment';
import {
  docToServerBurger,
  serverBurgerToBurger,
  type ServerBurger,
} from 'utils/serverBurger';

import { burgerMatchesUrlSegment } from './burgerMatchesUrlSegment';
import { getAdminFirestore } from './firebaseAdmin';

const BURGERS = 'burgers';
/** Legacy reviews without a stored `slug` — match computed canonical segment. */
const LEGACY_SLUG_SCAN_LIMIT = 500;

/** Firestore read for burger detail SSR on Firebase Hosting (Admin SDK + ADC). */
export async function resolveBurgerByUrlSegment(
  urlSegment: string
): Promise<ServerBurger | null> {
  const db = getAdminFirestore();

  if (looksLikeFirestoreDocumentId(urlSegment)) {
    const snap = await db.collection(BURGERS).doc(urlSegment).get();
    return snap.exists ? docToServerBurger(snap.id, snap.data()!) : null;
  }

  const legacyId = extractLegacyDocumentIdFromSlug(urlSegment);
  if (legacyId && legacyId !== urlSegment) {
    const legacySnap = await db.collection(BURGERS).doc(legacyId).get();
    if (legacySnap.exists) {
      return docToServerBurger(legacySnap.id, legacySnap.data()!);
    }
  }

  const slugSnap = await db
    .collection(BURGERS)
    .where('slug', '==', urlSegment)
    .limit(1)
    .get();

  if (!slugSnap.empty) {
    const doc = slugSnap.docs[0];
    return docToServerBurger(doc.id, doc.data() as DocumentData);
  }

  const recentSnap = await db
    .collection(BURGERS)
    .orderBy('timestamp', 'desc')
    .limit(LEGACY_SLUG_SCAN_LIMIT)
    .get();

  for (const doc of recentSnap.docs) {
    const burger = docToServerBurger(doc.id, doc.data() as DocumentData);
    if (burgerMatchesUrlSegment(serverBurgerToBurger(burger), urlSegment)) {
      return burger;
    }
  }

  return null;
}
