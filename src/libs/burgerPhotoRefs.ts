import { getFile } from './storage';

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

export function isBurgerStorageObjectPath(value: string): boolean {
  return value.startsWith(BURGER_PHOTO_PREFIX);
}

/** Stable key for comparing download URLs that may differ only by token query param. */
export function burgerImageReferenceKey(
  value: string | undefined
): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const path = storagePathFromDownloadUrl(trimmed);
  if (path) return path;
  if (trimmed.startsWith(BURGER_PHOTO_PREFIX)) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.split('?')[0] ?? trimmed;
  }
  return null;
}

export function burgerImageReferencesEqual(
  a: string | undefined,
  b: string | undefined
): boolean {
  if (!a || !b) return a === b;
  if (a === b) return true;
  const keyA = burgerImageReferenceKey(a);
  const keyB = burgerImageReferenceKey(b);
  return keyA != null && keyA === keyB;
}

export function resolveBurgerImageUrlSync(
  value: string | undefined
): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return undefined;
}

/** Firestore may store a download URL or a Storage object path (`burgers/...`). */
export async function resolveBurgerImageUrl(
  value: string | undefined
): Promise<string | undefined> {
  const sync = resolveBurgerImageUrlSync(value);
  if (sync) return sync;

  if (!value?.trim()) return undefined;
  const trimmed = value.trim();

  if (!isBurgerStorageObjectPath(trimmed)) {
    return undefined;
  }

  try {
    return await getFile(trimmed);
  } catch (error) {
    console.warn('Failed to resolve burger image path:', trimmed, error);
    return undefined;
  }
}
