import { Burger } from 'utils/types';

export const ADMINUID =
  process.env.NEXT_PUBLIC_ADMIN_UID ?? 'HN7f9PmeCgg3nd8WRFb6EhJVPnl2';

/**
 * Returns the publisher image for the selected string in comic date format MMM YYYY
 * @param {string} date - Datestamp for the issue
 * @example getFormattedDate('1996-09-01');
 * @return {string} SEP 1996
 */
export function getFormattedDate(
  date: Date,
  expanded?: boolean
): string | undefined {
  if (!date) return;

  const d: Date = new Date(date);
  let options: Intl.DateTimeFormatOptions = {
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  };

  if (expanded) {
    options = {
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
      year: 'numeric',
    };
  }

  const formattedDate: string = d.toLocaleDateString('en-us', options);

  return formattedDate;
}

/** Category weights; max total 100 at 5★ each (sauce ×2 = 10). */
const BURGER_SCORE_WEIGHTS = {
  appearance: 1,
  bun: 3,
  meat: 6,
  cheese: 5,
  veg: 3,
  sauce: 2,
} as const;

function weightedRating(stars: number | undefined, weight: number) {
  return (stars ?? 0) * weight;
}

export function calculateScore(item: Burger) {
  if (!item) return 0;

  return (
    weightedRating(item.appearance, BURGER_SCORE_WEIGHTS.appearance) +
    weightedRating(item.bun, BURGER_SCORE_WEIGHTS.bun) +
    weightedRating(item.meat, BURGER_SCORE_WEIGHTS.meat) +
    weightedRating(item.cheese, BURGER_SCORE_WEIGHTS.cheese) +
    weightedRating(item.veg, BURGER_SCORE_WEIGHTS.veg) +
    weightedRating(item.sauce, BURGER_SCORE_WEIGHTS.sauce)
  );
}

/** Prefer persisted `total`; otherwise derive from star ratings. */
export function getDisplayScore(item: Burger) {
  if (!item) return 0;
  if (typeof item.total === 'number' && !Number.isNaN(item.total)) {
    return item.total;
  }
  return calculateScore(item);
}

export function calculateScoreColor(score: number) {
  if (score >= 95) return 'bg-green-900';

  if (score >= 80 && score < 95) return 'bg-green-600';

  if (score >= 50 && score < 80) return 'bg-yellow-500';

  if (score >= 20 && score < 50) return 'bg-orange-500';

  if (score < 20) return 'bg-red-900';

  return 'bg-green-900';
}

export function calculateTimestamp(timestamp: number) {
  if (!timestamp) return;
  return new Date(timestamp * 1000);
}

/** Firestore timestamp → `YYYY-MM-DD` for a day-only date picker (UTC calendar day). */
export function timestampToDateInputValue(timestamp?: {
  seconds?: number;
}): string {
  if (timestamp?.seconds == null) return '';
  const date = calculateTimestamp(timestamp.seconds);
  if (!date) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` from a date picker → Date at noon UTC (no time-of-day stored). */
export function dateInputValueToUtcDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}
