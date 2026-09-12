const STORAGE_KEY = 'burgertime:reviewPageCursors';

export function readStoredPageCursors(): Map<number, string> {
  if (typeof window === 'undefined') {
    return new Map();
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();

    const parsed = JSON.parse(raw) as Record<string, string>;
    const map = new Map<number, string>();
    for (const [page, cursor] of Object.entries(parsed)) {
      const pageNum = Number(page);
      if (pageNum > 1 && cursor) {
        map.set(pageNum, cursor);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

export function writeStoredPageCursors(cursors: Map<number, string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const record: Record<string, string> = {};
    for (const [page, cursor] of cursors) {
      if (page > 1 && cursor) {
        record[String(page)] = cursor;
      }
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // sessionStorage unavailable or full
  }
}
