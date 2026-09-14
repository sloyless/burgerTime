import { useCallback, useState } from 'react';
import type { FormInstance } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

import { uploadBurgerPhotoReplacingPrevious } from 'libs/storage';

import { setBurgerFormImageUrls } from './burgerFormImage';
import type { BurgerFormValues } from './types';

type Options = {
  form: FormInstance<BurgerFormValues>;
  message: MessageInstance;
  /** Edit mode: do not delete this URL from Storage until the review is saved. */
  retainCommittedUrl?: string;
  retainCommittedImageCard?: string;
  onUploaded?: () => void;
};

export function useBurgerPhotoUpload({
  form,
  message,
  retainCommittedUrl,
  retainCommittedImageCard,
  onUploaded,
}: Options) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const previousUrl =
          (form.getFieldValue('image') as string | undefined) ??
          retainCommittedUrl;
        const previousCard =
          (form.getFieldValue('imageCard') as string | undefined) ??
          retainCommittedImageCard;
        const urls = await uploadBurgerPhotoReplacingPrevious(
          file,
          previousUrl,
          {
            retainCommittedUrl,
            previousImageCard: previousCard,
          }
        );
        setBurgerFormImageUrls(form, urls);
        onUploaded?.();
      } catch (error) {
        console.error('Image upload failed:', error);
        message.error('Photo upload failed.', 5);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [form, message, onUploaded, retainCommittedUrl, retainCommittedImageCard]
  );

  return { isUploading, uploadImage };
}
