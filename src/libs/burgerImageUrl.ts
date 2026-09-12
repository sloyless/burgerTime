import { getFile } from './storage';
import { isBurgerStoragePhotoUrl } from './storagePaths';

/** Firestore may store a download URL or a Storage object path (`burgers/...`). */
export async function resolveBurgerImageUrl(
  value: string | undefined
): Promise<string | undefined> {
  if (!value?.trim()) return undefined;

  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('burgers/')) {
    try {
      return await getFile(trimmed);
    } catch (error) {
      console.warn('Failed to resolve burger image path:', trimmed, error);
      return undefined;
    }
  }

  return undefined;
}

export function burgerImageReferencesEqual(
  a: string | undefined,
  b: string | undefined
): boolean {
  if (!a || !b) return a === b;
  if (a === b) return true;
  if (!isBurgerStoragePhotoUrl(a) || !isBurgerStoragePhotoUrl(b)) {
    return false;
  }
  return a.split('?')[0] === b.split('?')[0];
}
