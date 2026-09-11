export type ReviewPageCursor = {
  documentId: string;
  timestampSeconds: number;
};

export function encodeReviewPageCursor(cursor: ReviewPageCursor): string {
  return `${cursor.timestampSeconds}:${cursor.documentId}`;
}

export function decodeReviewPageCursor(
  value: string
): ReviewPageCursor | null {
  const colon = value.indexOf(':');
  if (colon < 0) return null;

  const timestampSeconds = Number(value.slice(0, colon));
  const documentId = value.slice(colon + 1);

  if (!documentId || Number.isNaN(timestampSeconds)) {
    return null;
  }

  return { timestampSeconds, documentId };
}
