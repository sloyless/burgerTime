import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { timestampToDateInputValue } from 'functions';
import { database } from 'utils/firebase';
import {
  extractLegacyDocumentIdFromSlug,
  isValidBurgerUrlSegment,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerUrlSegment';
import { Burger } from 'utils/types';

export {
  extractLegacyDocumentIdFromSlug,
  isValidBurgerUrlSegment,
  looksLikeFirestoreDocumentId,
};

function slugifyPart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** SEO slug: `{venue}-{burger-name}-{YYYY-MM-DD}` (optional `-2`, `-3` if same day). */
export function generateBurgerSlugBase(
  venue: string | undefined,
  burgerName: string | undefined,
  reviewDateYmd: string
): string {
  const base =
    slugifyPart(`${venue ?? ''}-${burgerName ?? ''}`) || 'burger-review';
  return `${base}-${reviewDateYmd}`;
}

/**
 * URL segment for a burger (no `/burger/` prefix). Must stay in sync with
 * `getBurgerPath` — links, redirects, and Firestore resolve all depend on this.
 */
export function getCanonicalBurgerSlug(burger: Burger): string {
  if (burger.slug) {
    return burger.slug;
  }

  const reviewDateYmd = timestampToDateInputValue(
    burger.timestamp as { seconds?: number }
  );
  if (!reviewDateYmd) {
    if (burger.id && looksLikeFirestoreDocumentId(burger.id)) {
      return burger.id;
    }
    return slugifyPart(burger.venue ?? 'burger-review') || 'burger-review';
  }

  return generateBurgerSlugBase(burger.venue, burger.burgerName, reviewDateYmd);
}

/** Public href for a burger detail page. */
export function getBurgerPath(burger: Burger): string {
  if (!burger.id) return '/';

  if (burger.slug) {
    return `/burger/${burger.slug}`;
  }

  const reviewDateYmd = timestampToDateInputValue(
    burger.timestamp as { seconds?: number }
  );
  if (!reviewDateYmd) {
    return `/burger/${burger.id}`;
  }

  return `/burger/${getCanonicalBurgerSlug(burger)}`;
}

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
