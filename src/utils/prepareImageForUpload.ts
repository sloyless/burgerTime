import imageCompression from 'browser-image-compression';

export type ImagePrepareOptions = {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  initialQuality?: number;
  /** Skip re-encoding when the file is already small enough. */
  skipIfUnderBytes?: number;
};

const DEFAULT_DETAIL: Required<ImagePrepareOptions> = {
  maxWidthOrHeight: 1600,
  maxSizeMB: 1.2,
  initialQuality: 0.82,
  skipIfUnderBytes: 350_000,
};

const DEFAULT_CARD: Required<ImagePrepareOptions> = {
  maxWidthOrHeight: 640,
  maxSizeMB: 0.35,
  initialQuality: 0.78,
  skipIfUnderBytes: 0,
};

function outputType(file: File): string {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/gif') return 'image/gif';
  return 'image/webp';
}

function extensionForType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/gif') return 'gif';
  return 'webp';
}

/**
 * Downscale and re-encode burger photos before upload (WebP for JPEG/HEIC-like inputs).
 */
export async function prepareImageForUpload(
  file: File,
  options?: ImagePrepareOptions
): Promise<File> {
  const opts = { ...DEFAULT_DETAIL, ...options };

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

  if (opts.skipIfUnderBytes > 0 && file.size <= opts.skipIfUnderBytes) {
    return file;
  }

  const fileType = outputType(file);

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: opts.maxWidthOrHeight,
      maxSizeMB: opts.maxSizeMB,
      initialQuality: opts.initialQuality,
      useWebWorker: true,
      fileType,
      preserveExif: false,
    });

    if (compressed.size >= file.size && opts.skipIfUnderBytes > 0) {
      return file;
    }

    const ext = extensionForType(fileType);
    if (!compressed.name.endsWith(`.${ext}`)) {
      const base = file.name.replace(/\.[^.]+$/, '') || 'burger-photo';
      return new File([compressed], `${base}.${ext}`, { type: fileType });
    }

    return compressed;
  } catch {
    return file;
  }
}

export function prepareBurgerDetailImage(file: File): Promise<File> {
  return prepareImageForUpload(file, DEFAULT_DETAIL);
}

export function prepareBurgerCardImage(file: File): Promise<File> {
  return prepareImageForUpload(file, DEFAULT_CARD);
}
