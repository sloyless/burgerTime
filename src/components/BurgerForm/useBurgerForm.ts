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
    veg: 0,
    sauce: 0,
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
    veg: doc.veg ?? 0,
    sauce: doc.sauce ?? 0,
    price: doc.price ?? 0,
    image: doc.image,
  };
}

export function burgerFormValuesToScoreInput(values: BurgerFormValues): Burger {
  return {
    appearance: values.appearance,
    bun: values.bun,
    cheese: values.cheese,
    meat: values.meat,
    sauce: values.sauce,
    veg: values.veg,
    image: values.image,
  };
}
