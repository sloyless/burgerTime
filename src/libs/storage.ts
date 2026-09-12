import { FirebaseError } from 'firebase/app';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { nanoid } from 'nanoid';

import { prepareImageForUpload } from 'utils/prepareImageForUpload';
import { storage } from '../utils/firebase';
import {
  isBurgerStoragePhotoUrl,
  storagePathFromDownloadUrl,
} from './storagePaths';

function isObjectNotFound(error: unknown): boolean {
  return (
    error instanceof FirebaseError && error.code === 'storage/object-not-found'
  );
}

export const uploadFile = async (file: File, folder: string) => {
  try {
    const prepared = await prepareImageForUpload(file);
    const filename = nanoid();
    const storageRef = ref(
      storage,
      `${folder}${filename}.${prepared.name.split('.').pop()}`
    );
    const contentType =
      prepared.type && prepared.type.startsWith('image/')
        ? prepared.type
        : 'image/jpeg';

    const res = await uploadBytes(storageRef, prepared, { contentType });

    return res.metadata.fullPath;
  } catch (error) {
    throw error;
  }
};

export const getFile = async (path: string) => {
  try {
    const fileRef = ref(storage, path);
    return getDownloadURL(fileRef);
  } catch (error) {
    throw error;
  }
};

/** Remove a burger photo object when its download URL points at our Storage bucket. */
export async function deleteBurgerPhotoByUrl(
  imageUrl: string | undefined
): Promise<void> {
  if (!imageUrl) return;

  const path = storagePathFromDownloadUrl(imageUrl);
  if (!path) return;

  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (!isObjectNotFound(error)) {
      console.warn('Failed to delete replaced burger photo:', path, error);
    }
  }
}

type ReplacePreviousOptions = {
  /** Download URL still tied to Firestore — do not delete from Storage until save. */
  retainCommittedUrl?: string;
};

/** Upload a new burger photo and delete superseded interim uploads from Storage. */
export async function uploadBurgerPhotoReplacingPrevious(
  file: File,
  previousImageUrl?: string,
  options?: ReplacePreviousOptions
): Promise<string> {
  const imagePath = await uploadFile(file, 'burgers/');
  const url = await getFile(imagePath);

  if (
    previousImageUrl &&
    previousImageUrl !== url &&
    isBurgerStoragePhotoUrl(previousImageUrl)
  ) {
    const isCommitted =
      options?.retainCommittedUrl != null &&
      previousImageUrl === options.retainCommittedUrl;
    if (!isCommitted) {
      await deleteBurgerPhotoByUrl(previousImageUrl);
    }
  }

  return url;
}
