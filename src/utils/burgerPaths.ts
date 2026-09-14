import { timestampToDateInputValue } from 'functions';
import {
  extractLegacyDocumentIdFromSlug,
  isValidBurgerUrlSegment,
  looksLikeFirestoreDocumentId,
} from 'utils/burgerUrlSegment';
import type { Burger } from 'utils/types';

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
