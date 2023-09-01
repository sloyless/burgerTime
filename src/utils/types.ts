import { FieldValue } from 'firebase/firestore';

export interface Burger {
  address?: string;
  appearance?: number;
  bun?: number;
  burgerName?: string;
  cheese?: number;
  cookType?: string;
  id?: string;
  meat?: number;
  notes?: string;
  price?: number;
  sauce?: number;
  timestamp?: FieldValue;
  total?: number;
  userId?: string;
  veg?: number;
  venue?: string;
}
