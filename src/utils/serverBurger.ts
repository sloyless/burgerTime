/** JSON-safe burger payload from `getServerSideProps` (client + server). */
export type ServerBurger = {
  id: string;
  address?: string;
  appearance?: number;
  bun?: number;
  burgerName?: string;
  cheese?: number;
  cookType?: string;
  image?: string;
  meat?: number;
  notes?: string;
  price?: number;
  sauce?: number;
  slug?: string;
  timestamp?: { seconds: number };
  total?: number;
  userId?: string;
  veg?: number;
  venue?: string;
};
