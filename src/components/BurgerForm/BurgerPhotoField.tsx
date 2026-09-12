import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Spin, Typography } from 'antd';

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
} as const;

const MAX_BYTES = 20 * 1024 * 1024;

type Props = {
  alt: string;
  imageUrl?: string;
  isUploading: boolean;
  onImageFile: (file: File) => void;
};

function BurgerPhotoField({
  alt,
  imageUrl,
  isUploading,
  onImageFile,
}: Readonly<Props>) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>();

  const revokeLocalPreview = useCallback((url: string | undefined) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    if (!imageUrl) return;
    setLocalPreviewUrl((prev) => {
      revokeLocalPreview(prev);
      return undefined;
    });
  }, [imageUrl, revokeLocalPreview]);

  useEffect(
    () => () => {
      revokeLocalPreview(localPreviewUrl);
    },
    [localPreviewUrl, revokeLocalPreview]
  );

  const displaySrc = localPreviewUrl ?? imageUrl;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const nextPreview = URL.createObjectURL(file);
      setLocalPreviewUrl((prev) => {
        revokeLocalPreview(prev);
        return nextPreview;
      });
      onImageFile(file);
    },
    [onImageFile, revokeLocalPreview]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: ACCEPT,
      maxFiles: 1,
      maxSize: MAX_BYTES,
      disabled: isUploading,
      onDrop,
    });

  const rejectionMessage = fileRejections[0]?.errors[0]?.message;

  return (
    <div className="border-t border-stone-200">
      <div
        {...getRootProps()}
        className={[
          'relative outline-none',
          isUploading ? 'cursor-wait' : 'cursor-pointer',
          !displaySrc &&
            'min-h-48 border-b border-dashed border-stone-200 bg-stone-50',
          isDragActive && !displaySrc && 'border-orange-300 bg-orange-50/80',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input {...getInputProps()} aria-label="Burger photo" />

        {displaySrc ? (
          <div className="relative">
            {displaySrc.startsWith('blob:') ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob preview before Firebase URL exists
              <img src={displaySrc} alt={alt} className="block h-auto w-full" />
            ) : (
              <Image
                width={500}
                height={300}
                src={displaySrc}
                alt={alt}
                className="w-full"
                loading="lazy"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            )}
            {isUploading ? (
              <div
                className="absolute inset-0 flex items-center justify-center bg-white/70"
                aria-live="polite"
              >
                <Spin size="large" description="Uploading photo…" />
              </div>
            ) : isDragActive ? (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/45 px-4 text-center text-sm font-medium text-white">
                Drop to replace photo
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-0 border-t border-stone-200/80 bg-stone-900/55 px-4 py-2 text-center text-sm text-white opacity-0 transition-opacity hover:opacity-100">
                Click or drag to replace photo
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            {isUploading ? (
              <Spin size="large" description="Uploading photo…" />
            ) : (
              <>
                <Typography.Text className="font-semibold text-stone-700">
                  Photo
                </Typography.Text>
                <Typography.Text type="secondary" className="max-w-sm">
                  {isDragActive
                    ? 'Drop your burger photo here'
                    : 'Drag a photo here, or click to choose'}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                  JPEG, PNG, or WebP · up to 20 MB
                </Typography.Text>
              </>
            )}
          </div>
        )}
      </div>
      {rejectionMessage ? (
        <p className="border-t border-stone-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {rejectionMessage}
        </p>
      ) : null}
    </div>
  );
}

export default BurgerPhotoField;
