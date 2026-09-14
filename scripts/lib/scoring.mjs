const BURGER_SCORE_WEIGHTS = {
  appearance: 1,
  bun: 3,
  meat: 6,
  cheese: 5,
  veg: 3,
  sauce: 2,
};

const NA_FIELD_BY_CATEGORY = {
  cheese: 'cheeseNA',
  veg: 'vegNA',
  sauce: 'sauceNA',
};

function isBurgerScoreCategoryActive(burger, category) {
  const naField = NA_FIELD_BY_CATEGORY[category];
  if (!naField) return true;
  return !burger[naField];
}

function starFactor(stars) {
  if (stars == null || Number.isNaN(stars) || stars < 1 || stars > 5) {
    return null;
  }
  return (stars - 1) / 4;
}

/** 0–100 from weighted 1–5★ ratings; optional categories omitted when marked N/A. */
export function calculateScore(item) {
  if (!item) return 0;

  let weightSum = 0;
  let earnedSum = 0;

  for (const category of Object.keys(BURGER_SCORE_WEIGHTS)) {
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

/** Matches app `getDisplayScore` (computed score, else stored `total`). */
export function getDisplayScore(item) {
  if (!item) return 0;
  const computed = calculateScore(item);
  if (computed > 0) return computed;
  if (item.total != null && !Number.isNaN(item.total)) {
    return item.total;
  }
  return computed;
}
