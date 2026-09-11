import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { timestampToDateInputValue } from 'functions';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';

const FIRESTORE_ID_PATTERN = /^[a-zA-Z0-9]{20}$/;

export function looksLikeFirestoreDocumentId(value: string): boolean {
  return FIRESTORE_ID_PATTERN.test(value);
}

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

export function getCanonicalBurgerSlug(burger: Burger): string {
  if (burger.slug) {
    return burger.slug;
  }

  const reviewDateYmd = timestampToDateInputValue(
    burger.timestamp as { seconds?: number }
  );
  if (!reviewDateYmd) {
    return slugifyPart(burger.venue ?? 'burger-review') || 'burger-review';
  }

  return generateBurgerSlugBase(burger.venue, burger.burgerName, reviewDateYmd);
}

export function getBurgerPath(burger: Burger): string {
  if (!burger.id) return '/';
  if (burger.slug) {
    return `/burger/${burger.slug}`;
  }
  const reviewDateYmd = timestampToDateInputValue(
    burger.timestamp as { seconds?: number }
  );
  if (reviewDateYmd) {
    return `/burger/${generateBurgerSlugBase(
      burger.venue,
      burger.burgerName,
      reviewDateYmd
    )}`;
  }
  return `/burger/${burger.id}`;
}

/** Legacy URLs that ended with a Firestore document id. */
export function extractLegacyDocumentIdFromSlug(
  segment: string
): string | null {
  if (looksLikeFirestoreDocumentId(segment)) {
    return segment;
  }

  const lastDash = segment.lastIndexOf('-');
  if (lastDash < 0) return null;

  const candidate = segment.slice(lastDash + 1);
  return looksLikeFirestoreDocumentId(candidate) ? candidate : null;
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
