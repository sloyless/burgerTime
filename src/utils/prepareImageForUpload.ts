import imageCompression from 'browser-image-compression';

const MAX_EDGE_PX = 1600;
const MAX_SIZE_MB = 1.6;
const SKIP_IF_UNDER_BYTES = 350_000;

/**
 * Downscale and re-encode burger photos before upload so list/detail pages
 * download smaller files (Firebase Hosting serves originals; no Next image API).
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (
    file.type &&
    !file.type.startsWith('image/') &&
    file.type !== 'application/octet-stream'
  ) {
    return file;
  }
  if (file.type === 'image/gif') {
    return file;
  }

  if (file.size <= SKIP_IF_UNDER_BYTES) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_EDGE_PX,
      maxSizeMB: MAX_SIZE_MB,
      initialQuality: 0.82,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      preserveExif: false,
    });

    if (compressed.size >= file.size) {
      return file;
    }

    return compressed;
  } catch {
    return file;
  }
}
