export interface Burger {
  address?: string;
  appearance?: number;
  bun?: number;
  cheese?: number;
  cookType?: string;
  id?: string;
  meat?: number;
  notes?: string;
  price?: number;
  sauce?: number;
  timestamp?: {
    nanoseconds: number;
    seconds: number;
  };
  userId?: string;
  veg?: number;
  venue?: string;
}
