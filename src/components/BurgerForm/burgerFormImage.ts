import type { FormInstance } from 'antd';

import type { BurgerFormValues } from './types';

export function setBurgerFormImageUrls(
  form: FormInstance<BurgerFormValues>,
  urls: { image: string; imageCard?: string }
): void {
  form.setFields([
    { name: 'image', value: urls.image, touched: true },
    { name: 'imageCard', value: urls.imageCard, touched: true },
  ]);
}

export function burgerFormImagesFromValues(values: BurgerFormValues): {
  image?: string;
  imageCard?: string;
} {
  const image = values.image?.trim();
  const imageCard = values.imageCard?.trim();
  return {
    ...(image ? { image } : {}),
    ...(imageCard ? { imageCard } : {}),
  };
}

/** @deprecated Use burgerFormImagesFromValues */
export function burgerFormImageFromValues(
  values: BurgerFormValues
): string | undefined {
  return burgerFormImagesFromValues(values).image;
}
