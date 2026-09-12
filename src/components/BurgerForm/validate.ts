import { Form, type FormInstance } from 'antd';
import { useMemo } from 'react';

import type { BurgerFormValues } from './types';

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasRating(value: number | undefined): boolean {
  return typeof value === 'number' && value > 0;
}

/** True when all required form fields pass the same rules as submit validation. */
export function isBurgerFormComplete(values: BurgerFormValues): boolean {
  return (
    hasText(values.venue) &&
    hasText(values.address) &&
    hasText(values.burgerName) &&
    hasText(values.reviewDate) &&
    hasRating(values.appearance) &&
    hasRating(values.bun) &&
    hasRating(values.meat) &&
    (values.cheeseNA || hasRating(values.cheese)) &&
    (values.vegNA || hasRating(values.veg)) &&
    (values.sauceNA || hasRating(values.sauce))
  );
}

export function useBurgerFormComplete(
  form: FormInstance<BurgerFormValues>
): boolean {
  const venue = Form.useWatch('venue', form);
  const address = Form.useWatch('address', form);
  const burgerName = Form.useWatch('burgerName', form);
  const reviewDate = Form.useWatch('reviewDate', form);
  const appearance = Form.useWatch('appearance', form);
  const bun = Form.useWatch('bun', form);
  const meat = Form.useWatch('meat', form);
  const cheese = Form.useWatch('cheese', form);
  const cheeseNA = Form.useWatch('cheeseNA', form);
  const veg = Form.useWatch('veg', form);
  const vegNA = Form.useWatch('vegNA', form);
  const sauce = Form.useWatch('sauce', form);
  const sauceNA = Form.useWatch('sauceNA', form);

  return useMemo(
    () =>
      isBurgerFormComplete({
        venue: venue ?? '',
        address: address ?? '',
        burgerName: burgerName ?? '',
        reviewDate: reviewDate ?? '',
        appearance: appearance ?? 0,
        bun: bun ?? 0,
        meat: meat ?? 0,
        cheese: cheese ?? 0,
        cheeseNA: Boolean(cheeseNA),
        veg: veg ?? 0,
        vegNA: Boolean(vegNA),
        sauce: sauce ?? 0,
        sauceNA: Boolean(sauceNA),
        notes: '',
        cookType: '',
        price: 0,
      }),
    [
      venue,
      address,
      burgerName,
      reviewDate,
      appearance,
      bun,
      meat,
      cheese,
      cheeseNA,
      veg,
      vegNA,
      sauce,
      sauceNA,
    ]
  );
}
