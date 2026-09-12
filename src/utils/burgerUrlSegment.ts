/** Pure URL path helpers (no Firebase). Detail pages read the segment via `useBurgerUrlSegment`. */

const FIRESTORE_ID_PATTERN = /^[a-zA-Z0-9]{20}$/;

const BURGER_DETAIL_PATH = /^\/burger\/([^/]+)$/;

/** Read slug from `/burger/{segment}` (static export + Hosting rewrite). */
export function getBurgerUrlSegmentFromAsPath(asPath: string): string {
  const pathOnly = asPath.split('?')[0].split('#')[0];
  const match = pathOnly.match(BURGER_DETAIL_PATH);
  if (!match) return '';
  let segment: string;
  try {
    segment = decodeURIComponent(match[1]);
  } catch {
    segment = match[1];
  }
  return segment === '[slug]' ? '' : segment;
}

export function looksLikeFirestoreDocumentId(value: string): boolean {
  return FIRESTORE_ID_PATTERN.test(value);
}

export function isValidBurgerUrlSegment(segment: string): boolean {
  if (!segment || segment.length > 220) {
    return false;
  }
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(segment) ||
    looksLikeFirestoreDocumentId(segment)
  );
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
