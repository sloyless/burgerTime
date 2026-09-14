import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { getProjectId, loadEnvFiles } from './load-env.mjs';

const PAGE_SIZE = 500;
const BURGERS = 'burgers';

let db;

export function initAdminFirestore() {
  loadEnvFiles();
  if (!getApps().length) {
    initializeApp({ projectId: getProjectId() });
  }
  db = getFirestore();
  return db;
}

export function getDb() {
  if (!db) return initAdminFirestore();
  return db;
}

/** @returns {Promise<Array<{ id: string, data: Record<string, unknown> }>>} */
export async function fetchAllBurgers() {
  const firestore = getDb();
  const items = [];
  let lastId;

  while (true) {
    let query = firestore.collection(BURGERS).orderBy('__name__').limit(PAGE_SIZE);
    if (lastId) {
      query = query.startAfter(lastId);
    }
    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      items.push({ id: doc.id, data: doc.data() });
    }
    lastId = snap.docs[snap.docs.length - 1].ref;
    if (snap.size < PAGE_SIZE) break;
  }

  return items;
}

export function burgerFromDoc(doc) {
  return { ...doc.data, id: doc.id };
}
