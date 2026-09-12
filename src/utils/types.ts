import { FieldValue } from 'firebase/firestore';

export interface Burger {
  address?: string;
  appearance?: number;
  bun?: number;
  burgerName?: string;
  cheese?: number;
  /** Cheese not on this burger — excluded from score. */
  cheeseNA?: boolean;
  cookType?: string;
  id?: string;
  image?: string;
  meat?: number;
  notes?: string;
  price?: number;
  sauce?: number;
  /** Sauces not on this burger — excluded from score. */
  sauceNA?: boolean;
  slug?: string;
  timestamp?: FieldValue;
  total?: number;
  userId?: string;
  veg?: number;
  /** Vegetables not on this burger — excluded from score. */
  vegNA?: boolean;
  venue?: string;
}
