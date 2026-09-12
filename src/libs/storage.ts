import { FirebaseError } from 'firebase/app';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { nanoid } from 'nanoid';

import { prepareImageForUpload } from 'utils/prepareImageForUpload';
import { storage } from '../utils/firebase';
import {
  burgerImageReferencesEqual,
  isBurgerStorageObjectPath,
  isBurgerStoragePhotoUrl,
  storagePathFromDownloadUrl,
} from './burgerPhotoRefs';

const BURGER_PHOTO_FOLDER = 'burgers/';

function isObjectNotFound(error: unknown): boolean {
  return (
    error instanceof FirebaseError && error.code === 'storage/object-not-found'
  );
}

function uploadExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function storagePathFromReference(reference: string): string | null {
  if (isBurgerStorageObjectPath(reference)) {
    return reference;
  }
  return storagePathFromDownloadUrl(reference);
}

export async function uploadBurgerPhoto(file: File): Promise<string> {
  const prepared = await prepareImageForUpload(file);
  const storageRef = ref(
    storage,
    `${BURGER_PHOTO_FOLDER}${nanoid()}.${uploadExtension(prepared)}`
  );
  const contentType =
    prepared.type && prepared.type.startsWith('image/')
      ? prepared.type
      : 'image/jpeg';

  await uploadBytes(storageRef, prepared, { contentType });
  return getDownloadURL(storageRef);
}

export const getFile = async (path: string) =>
  getDownloadURL(ref(storage, path));

export async function deleteBurgerPhoto(
  reference: string | undefined
): Promise<void> {
  if (!reference) return;

  const path = storagePathFromReference(reference);
  if (!path) return;

  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (!isObjectNotFound(error)) {
      console.warn('Failed to delete burger photo:', path, error);
    }
  }
}

type ReplacePreviousOptions = {
  retainCommittedUrl?: string;
};

export async function uploadBurgerPhotoReplacingPrevious(
  file: File,
  previousReference?: string,
  options?: ReplacePreviousOptions
): Promise<string> {
  const url = await uploadBurgerPhoto(file);

  if (
    previousReference &&
    !burgerImageReferencesEqual(previousReference, url) &&
    (isBurgerStoragePhotoUrl(previousReference) ||
      isBurgerStorageObjectPath(previousReference))
  ) {
    const isCommitted =
      options?.retainCommittedUrl != null &&
      burgerImageReferencesEqual(previousReference, options.retainCommittedUrl);
    if (!isCommitted) {
      await deleteBurgerPhoto(previousReference);
    }
  }

  return url;
}

export async function deleteReplacedBurgerPhotoAfterSave(
  previousImage: string | undefined,
  nextImage: string | undefined
): Promise<void> {
  if (
    previousImage &&
    nextImage &&
    !burgerImageReferencesEqual(previousImage, nextImage)
  ) {
    await deleteBurgerPhoto(previousImage);
  }
}
