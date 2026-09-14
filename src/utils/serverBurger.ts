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

export function docToServerBurger(
  id: string,
  data: DocumentData
): ServerBurger {
  const { timestamp, ...rest } = data;
  return {
    ...(rest as Omit<ServerBurger, 'id' | 'timestamp'>),
    id,
    timestamp: serializeTimestamp(timestamp),
  };
}

export function serverBurgerToBurger(burger: ServerBurger): Burger {
  return burger as Burger;
}
