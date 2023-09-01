import { Burger } from 'utils/types';

/**
 * Returns the publisher image for the selected string in comic date format MMM YYYY
 * @param {string} date - Datestamp for the issue
 * @example getFormattedDate('1996-09-01');
 * @return {string} SEP 1996
 */
export function getFormattedDate(date: Date): string | undefined {
  if (!date) return;

  const d: Date = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  };
  const formattedDate: string = d.toLocaleDateString('en-us', options);

  return formattedDate;
}

export function calculateScore(item: Burger) {
  if (!item) return 0;

  const burgerMult = {
    appearance: 1,
    bun: 3,
    meat: 6,
    cheese: 5,
    veg: 3,
    sauce: 2,
  };

  // Burger math!
  let total = 0;
  const appearance = (item.appearance ?? 1) * burgerMult.appearance;
  const bun = (item.bun ?? 3) * burgerMult.bun;
  const meat = (item.meat ?? 3) * burgerMult.meat;
  const cheese = (item.cheese ?? 3) * burgerMult.cheese;
  const veg = (item.veg ?? 3) * burgerMult.veg;
  const sauce = (item.sauce ?? 3) * burgerMult.sauce;
  total = appearance + bun + meat + cheese + veg + sauce;

  return total;
}

export function calculateScoreColor(score: number) {
  if (score >= 95) return 'bg-green-900';

  if (score >= 80 && score < 95) return 'bg-green-600';

  if (score >= 50 && score < 80) return 'bg-yellow-500';

  if (score >= 20 && score < 50) return 'bg-orange-500';

  if (score < 20) return 'bg-red-900';

  return 'bg-green-900';
}
