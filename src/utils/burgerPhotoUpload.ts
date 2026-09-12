/** Client-side cap before upload (original is compressed when possible). */
export const MAX_BURGER_PHOTO_UPLOAD_BYTES = 100 * 1024 * 1024;

export function formatMaxBurgerPhotoUploadSize(): string {
  const mb = MAX_BURGER_PHOTO_UPLOAD_BYTES / (1024 * 1024);
  return `${mb} MB`;
}
