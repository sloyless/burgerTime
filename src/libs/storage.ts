import { FirebaseError } from 'firebase/app';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { nanoid } from 'nanoid';

import {
  prepareBurgerCardImage,
  prepareBurgerDetailImage,
} from 'utils/prepareImageForUpload';
import { storage } from '../utils/firebase';
import {
  burgerImageReferencesEqual,
  companionCardStoragePath,
  isBurgerStorageObjectPath,
  isBurgerStoragePhotoUrl,
  storagePathFromDownloadUrl,
} from './burgerPhotoRefs';

const BURGER_PHOTO_FOLDER = 'burgers/';

export type BurgerPhotoUrls = {
  image: string;
  imageCard?: string;
};

function isObjectNotFound(error: unknown): boolean {
  return (
    error instanceof FirebaseError && error.code === 'storage/object-not-found'
  );
}

function storagePathFromReference(reference: string): string | null {
  if (isBurgerStorageObjectPath(reference)) {
    return reference;
  }
  return storagePathFromDownloadUrl(reference);
}

async function deleteStoragePath(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (!isObjectNotFound(error)) {
      console.warn('Failed to delete burger photo:', path, error);
    }
  }
}

export async function deleteBurgerPhoto(
  reference: string | undefined
): Promise<void> {
  if (!reference) return;

  const path = storagePathFromReference(reference);
  if (!path) return;

  await deleteStoragePath(path);

  const cardPath = companionCardStoragePath(path);
  if (cardPath) {
    await deleteStoragePath(cardPath);
  }
}

export async function uploadBurgerPhoto(file: File): Promise<BurgerPhotoUrls> {
  const [detailFile, cardFile] = await Promise.all([
    prepareBurgerDetailImage(file),
    prepareBurgerCardImage(file),
  ]);

  const id = nanoid();
  const detailType =
    detailFile.type && detailFile.type.startsWith('image/')
      ? detailFile.type
      : 'image/webp';
  const cardType =
    cardFile.type && cardFile.type.startsWith('image/')
      ? cardFile.type
      : 'image/webp';
  const detailExt =
    detailFile.name.split('.').pop()?.toLowerCase() ||
    (detailType === 'image/png' ? 'png' : 'webp');
  const cardExt =
    cardFile.name.split('.').pop()?.toLowerCase() ||
    (cardType === 'image/png' ? 'png' : 'webp');

  const detailRef = ref(storage, `${BURGER_PHOTO_FOLDER}${id}.${detailExt}`);
  const cardRef = ref(storage, `${BURGER_PHOTO_FOLDER}${id}_card.${cardExt}`);

  await Promise.all([
    uploadBytes(detailRef, detailFile, { contentType: detailType }),
    uploadBytes(cardRef, cardFile, { contentType: cardType }),
  ]);

  const [image, imageCard] = await Promise.all([
    getDownloadURL(detailRef),
    getDownloadURL(cardRef),
  ]);

  return { image, imageCard };
}

export const getFile = async (path: string) =>
  getDownloadURL(ref(storage, path));

type ReplacePreviousOptions = {
  retainCommittedUrl?: string;
  previousImageCard?: string;
};

export async function uploadBurgerPhotoReplacingPrevious(
  file: File,
  previousReference?: string,
  options?: ReplacePreviousOptions
): Promise<BurgerPhotoUrls> {
  const urls = await uploadBurgerPhoto(file);

  if (
    previousReference &&
    !burgerImageReferencesEqual(previousReference, urls.image) &&
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

  const prevCard = options?.previousImageCard;
  if (
    prevCard &&
    urls.imageCard &&
    !burgerImageReferencesEqual(prevCard, urls.imageCard) &&
    (isBurgerStoragePhotoUrl(prevCard) || isBurgerStorageObjectPath(prevCard))
  ) {
    const retainCard =
      options?.retainCommittedUrl != null &&
      burgerImageReferencesEqual(prevCard, options.retainCommittedUrl);
    if (!retainCard) {
      await deleteBurgerPhoto(prevCard);
    }
  }

  return urls;
}

export async function deleteReplacedBurgerPhotoAfterSave(
  previousImage: string | undefined,
  nextImage: string | undefined,
  previousImageCard?: string,
  nextImageCard?: string
): Promise<void> {
  if (
    previousImage &&
    nextImage &&
    !burgerImageReferencesEqual(previousImage, nextImage)
  ) {
    await deleteBurgerPhoto(previousImage);
  } else if (
    previousImageCard &&
    nextImageCard &&
    !burgerImageReferencesEqual(previousImageCard, nextImageCard)
  ) {
    await deleteBurgerPhoto(previousImageCard);
  }
}
