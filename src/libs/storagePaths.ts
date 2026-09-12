const BURGER_PHOTO_PREFIX = 'burgers/';

/** Decode a Firebase Storage download URL into an object path (e.g. `burgers/abc.jpg`). */
export function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('firebasestorage.googleapis.com')) {
      return null;
    }

    const encoded = parsed.pathname.split('/o/')[1];
    if (!encoded) return null;

    const path = decodeURIComponent(encoded.split('?')[0] ?? encoded);
    if (!path.startsWith(BURGER_PHOTO_PREFIX)) {
      return null;
    }

    return path;
  } catch {
    return null;
  }
}

export function isBurgerStoragePhotoUrl(url: string): boolean {
  return storagePathFromDownloadUrl(url) != null;
}
