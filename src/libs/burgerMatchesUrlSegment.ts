import { getCanonicalBurgerSlug } from 'utils/burgerPaths';
import type { Burger } from 'utils/types';

/** Match stored `slug` or computed canonical path segment (legacy docs without `slug`). */
export function burgerMatchesUrlSegment(
  burger: Burger,
  urlSegment: string
): boolean {
  if (burger.slug === urlSegment) {
    return true;
  }
  if (!burger.id) {
    return false;
  }
  return getCanonicalBurgerSlug(burger) === urlSegment;
}
