import { DocumentData } from 'firebase/firestore';

import { timestampToDateInputValue } from 'functions';
import { Burger } from 'utils/types';

import { BurgerFormValues } from './types';

function defaultReviewDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyBurgerFormValues(): BurgerFormValues {
  return {
    venue: '',
    address: '',
    burgerName: '',
    notes: '',
    cookType: '',
    reviewDate: defaultReviewDate(),
    appearance: 0,
    bun: 0,
    meat: 0,
    cheese: 0,
    cheeseNA: false,
    veg: 0,
    vegNA: false,
    sauce: 0,
    sauceNA: false,
    price: 0,
    image: undefined,
  };
}

export function burgerDocumentToFormValues(
  doc: DocumentData
): BurgerFormValues {
  return {
    venue: doc.venue ?? '',
    address: doc.address ?? '',
    burgerName: doc.burgerName ?? '',
    notes: doc.notes ?? '',
    cookType: doc.cookType ?? '',
    reviewDate: timestampToDateInputValue(doc.timestamp),
    appearance: doc.appearance ?? 0,
    bun: doc.bun ?? 0,
    meat: doc.meat ?? 0,
    cheese: doc.cheese ?? 0,
    cheeseNA: Boolean(doc.cheeseNA),
    veg: doc.veg ?? 0,
    vegNA: Boolean(doc.vegNA),
    sauce: doc.sauce ?? 0,
    sauceNA: Boolean(doc.sauceNA),
    price: doc.price ?? 0,
    image: doc.image,
  };
}

const BURGER_FORM_VALUE_KEYS: (keyof BurgerFormValues)[] = [
  'venue',
  'address',
  'burgerName',
  'notes',
  'cookType',
  'reviewDate',
  'appearance',
  'bun',
  'meat',
  'cheese',
  'cheeseNA',
  'veg',
  'vegNA',
  'sauce',
  'sauceNA',
  'price',
  'image',
];

export function areBurgerFormValuesEqual(
  a: BurgerFormValues,
  b: BurgerFormValues
): boolean {
  return BURGER_FORM_VALUE_KEYS.every((key) => {
    const left = a[key];
    const right = b[key];
    if (typeof left === 'boolean' || typeof right === 'boolean') {
      return Boolean(left) === Boolean(right);
    }
    if (typeof left === 'number' || typeof right === 'number') {
      return (left ?? 0) === (right ?? 0);
    }
    return (left ?? '') === (right ?? '');
  });
}

export function burgerFormValuesToScoreInput(values: BurgerFormValues): Burger {
  return {
    appearance: values.appearance,
    bun: values.bun,
    cheese: values.cheese,
    cheeseNA: values.cheeseNA,
    meat: values.meat,
    sauce: values.sauce,
    veg: values.veg,
    vegNA: values.vegNA,
    sauceNA: values.sauceNA,
    image: values.image,
  };
}
