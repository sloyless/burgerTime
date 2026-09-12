import type { DocumentData, Timestamp } from 'firebase-admin/firestore';

import {
  extractLegacyDocumentIdFromSlug,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerSlug';
import type { ServerBurger } from 'utils/serverBurger';
import { getAdminFirestore } from './firebaseAdmin';

const BURGERS = 'burgers';

function serializeTimestamp(
  value: Timestamp | { seconds?: number } | undefined
): { seconds: number } | undefined {
  if (!value) return undefined;
  if (typeof (value as Timestamp).toDate === 'function') {
    const date = (value as Timestamp).toDate();
    return { seconds: Math.floor(date.getTime() / 1000) };
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return { seconds: (value as { seconds: number }).seconds };
  }
  return undefined;
}

function docToServerBurger(id: string, data: DocumentData): ServerBurger {
  const { timestamp, ...rest } = data;
  return {
    ...(rest as Omit<ServerBurger, 'id' | 'timestamp'>),
    id,
    timestamp: serializeTimestamp(timestamp),
  };
}

/** Pages Router: call only from `getServerSideProps`. */
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
    return docToServerBurger(doc.id, doc.data());
  }

  return null;
}
