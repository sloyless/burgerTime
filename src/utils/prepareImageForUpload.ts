const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_IF_UNDER_BYTES = 350_000;

function outputType(file: File): string {
  if (file.type === 'image/png') return 'image/png';
  return 'image/jpeg';
}

function fileExtension(mime: string): string {
  return mime === 'image/png' ? 'png' : 'jpg';
}

/**
 * Downscale and re-encode burger photos before upload so list/detail pages
 * download smaller files (Firebase Hosting serves originals; no Next image API).
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  if (file.size <= SKIP_IF_UNDER_BYTES) {
    return file;
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, MAX_EDGE_PX / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = outputType(file);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, JPEG_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'burger';
  return new File([blob], `${baseName}.${fileExtension(mime)}`, {
    type: mime,
    lastModified: Date.now(),
  });
}
