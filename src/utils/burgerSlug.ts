import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { generateBurgerSlugBase } from 'utils/burgerPaths';
import { database } from 'utils/firebase';
import type { Burger } from 'utils/types';

export {
  extractLegacyDocumentIdFromSlug,
  generateBurgerSlugBase,
  getBurgerPath,
  getCanonicalBurgerSlug,
  isValidBurgerUrlSegment,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerPaths';

async function isSlugUsedByOtherDocument(
  slug: string,
  excludeDocumentId?: string
): Promise<boolean> {
  const slugQuery = query(
    collection(database, 'burgers'),
    where('slug', '==', slug),
    limit(1)
  );
  const snapshot = await getDocs(slugQuery);
  if (snapshot.empty) return false;
  if (excludeDocumentId && snapshot.docs[0].id === excludeDocumentId) {
    return false;
  }
  return true;
}

/** Picks a unique slug; appends `-2`, `-3`, … when venue/name/date collide. */
export async function allocateBurgerSlug(
  venue: string | undefined,
  burgerName: string | undefined,
  reviewDateYmd: string,
  excludeDocumentId?: string
): Promise<string> {
  const base = generateBurgerSlugBase(venue, burgerName, reviewDateYmd);
  let candidate = base;
  let suffix = 2;

  while (await isSlugUsedByOtherDocument(candidate, excludeDocumentId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export type { Burger };
