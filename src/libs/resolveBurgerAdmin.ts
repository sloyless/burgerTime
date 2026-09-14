import type { DocumentData } from 'firebase-admin/firestore';

import {
  extractLegacyDocumentIdFromSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerUrlSegment';
import { docToServerBurger, type ServerBurger } from 'utils/serverBurger';

import { getAdminFirestore } from './firebaseAdmin';

const BURGERS = 'burgers';

/** Hosting SSR on Cloud Functions — uses Admin SDK (ADC). See Firebase Next.js hosting docs. */
export async function resolveBurgerByUrlSegmentAdmin(
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

  return null;
}
