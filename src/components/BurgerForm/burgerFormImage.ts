import type { FormInstance } from 'antd';

import type { BurgerFormValues } from './types';

export function setBurgerFormImageUrl(
  form: FormInstance<BurgerFormValues>,
  url: string
): void {
  form.setFields([{ name: 'image', value: url, touched: true }]);
}

export function burgerFormImageFromValues(
  values: BurgerFormValues
): string | undefined {
  const image = values.image?.trim();
  return image || undefined;
}
