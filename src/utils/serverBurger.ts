import type { DocumentData, Timestamp } from 'firebase/firestore';

import type { Burger } from 'utils/types';

/** JSON-safe burger payload from `getServerSideProps`. */
export type ServerBurger = {
  id: string;
  address?: string;
  appearance?: number;
  bun?: number;
  burgerName?: string;
  cheese?: number;
  cheeseNA?: boolean;
  cookType?: string;
  image?: string;
  meat?: number;
  notes?: string;
  price?: number;
  sauce?: number;
  sauceNA?: boolean;
  slug?: string;
  timestamp?: { seconds: number };
  total?: number;
  userId?: string;
  veg?: number;
  vegNA?: boolean;
  venue?: string;
};

const SERVER_BURGER_KEYS = [
  'address',
  'appearance',
  'bun',
  'burgerName',
  'cheese',
  'cheeseNA',
  'cookType',
  'image',
  'meat',
  'notes',
  'price',
  'sauce',
  'sauceNA',
  'slug',
  'total',
  'userId',
  'veg',
  'vegNA',
  'venue',
] as const satisfies ReadonlyArray<
  keyof Omit<ServerBurger, 'id' | 'timestamp'>
>;

function serializeTimestamp(
  value: Timestamp | { seconds?: number } | undefined
): { seconds: number } | undefined {
  if (!value) return undefined;
  if (typeof (value as Timestamp).toJSON === 'function') {
    const json = (value as Timestamp).toJSON();
    if (json && typeof json.seconds === 'number') {
      return { seconds: json.seconds };
    }
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return { seconds: (value as { seconds: number }).seconds };
  }
  return undefined;
}

function pickSerializableFields(
  data: DocumentData
): Omit<ServerBurger, 'id' | 'timestamp'> {
  const picked: Record<string, unknown> = {};
  for (const key of SERVER_BURGER_KEYS) {
    const value = data[key];
    if (value === undefined) continue;
    if (value === null) continue;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      picked[key] = value;
    }
  }
  return picked as Omit<ServerBurger, 'id' | 'timestamp'>;
}

export function docToServerBurger(
  id: string,
  data: DocumentData
): ServerBurger {
  return {
    ...pickSerializableFields(data),
    id,
    timestamp: serializeTimestamp(data.timestamp),
  };
}

export function serverBurgerToBurger(burger: ServerBurger): Burger {
  return burger as Burger;
}
