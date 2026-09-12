import { getBurgerPath } from 'utils/burgerSlug';
import type { Burger } from 'utils/types';

/** Paths (`/burger/...`) for burgers in the current top-10 list. */
export function buildTopTenPathLookup(burgers: Burger[]): ReadonlySet<string> {
  const paths = new Set<string>();
  for (const burger of burgers) {
    const path = getBurgerPath(burger);
    if (path !== '/') {
      paths.add(path);
    }
  }
  return paths;
}

export function isBurgerInTopTenLookup(
  burger: Burger,
  lookup: ReadonlySet<string>
): boolean {
  const path = getBurgerPath(burger);
  return path !== '/' && lookup.has(path);
}
