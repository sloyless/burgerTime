const STORAGE_KEY = 'burgertime:slugToDocId';

function readMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getCachedBurgerDocId(urlSegment: string): string | null {
  const id = readMap()[urlSegment];
  return id ?? null;
}

export function cacheBurgerDocId(urlSegment: string, documentId: string): void {
  if (typeof window === 'undefined' || !urlSegment || !documentId) return;
  try {
    const map = readMap();
    map[urlSegment] = documentId;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}
