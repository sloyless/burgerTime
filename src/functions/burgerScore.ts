import { Burger } from 'utils/types';

export type BurgerScoreCategory =
  | 'appearance'
  | 'bun'
  | 'meat'
  | 'cheese'
  | 'veg'
  | 'sauce';

/** Relative importance; active categories always scale to 100. */
export const BURGER_SCORE_WEIGHTS: Record<BurgerScoreCategory, number> = {
  appearance: 1,
  bun: 3,
  meat: 6,
  cheese: 5,
  veg: 3,
  sauce: 2,
};

const NA_FIELD_BY_CATEGORY: Partial<
  Record<BurgerScoreCategory, keyof Pick<Burger, 'cheeseNA' | 'vegNA' | 'sauceNA'>>
> = {
  cheese: 'cheeseNA',
  veg: 'vegNA',
  sauce: 'sauceNA',
};

export function isBurgerScoreCategoryActive(
  burger: Burger,
  category: BurgerScoreCategory
): boolean {
  const naField = NA_FIELD_BY_CATEGORY[category];
  if (!naField) return true;
  return !burger[naField];
}

function starFactor(stars: number | undefined): number | null {
  if (stars == null || Number.isNaN(stars) || stars < 1 || stars > 5) {
    return null;
  }
  return (stars - 1) / 4;
}

/** 0–100 from weighted 1–5★ ratings; optional categories omitted when marked N/A. */
export function calculateScore(item: Burger): number {
  if (!item) return 0;

  let weightSum = 0;
  let earnedSum = 0;

  for (const category of Object.keys(BURGER_SCORE_WEIGHTS) as BurgerScoreCategory[]) {
    if (!isBurgerScoreCategoryActive(item, category)) continue;

    const weight = BURGER_SCORE_WEIGHTS[category];
    const factor = starFactor(item[category]);
    if (factor == null) continue;

    weightSum += weight;
    earnedSum += weight * factor;
  }

  if (weightSum === 0) return 0;

  return Math.round((earnedSum / weightSum) * 100);
}
