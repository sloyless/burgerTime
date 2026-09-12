/** Pure URL helpers — safe to import from getServerSideProps / server code (no Firebase client). */

const FIRESTORE_ID_PATTERN = /^[a-zA-Z0-9]{20}$/;

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
