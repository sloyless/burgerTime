import { calculateTimestamp, getDisplayScore } from 'functions';
import { Burger } from 'utils/types';

export type BurgerCollectionStats = {
  uniqueVenues: number;
  averageScore: number;
  eliteCount: number;
  reviewsThisYear: number;
  busiestYear: { year: number; count: number } | null;
};

function reviewYear(burger: Burger): number | null {
  const seconds = (burger.timestamp as { seconds?: number } | undefined)
    ?.seconds;
  if (seconds == null) return null;
  const date = calculateTimestamp(seconds);
  return date ? date.getUTCFullYear() : null;
}

export function computeBurgerCollectionStats(
  burgers: Burger[]
): BurgerCollectionStats {
  const venueSet = new Set<string>();
  const yearCounts = new Map<number, number>();
  const scores: number[] = [];
  let eliteCount = 0;
  const currentYear = new Date().getUTCFullYear();
  let reviewsThisYear = 0;

  for (const burger of burgers) {
    const venue = burger.venue?.trim();
    if (venue) venueSet.add(venue.toLowerCase());

    const score = getDisplayScore(burger);
    scores.push(score);
    if (score >= 90) eliteCount += 1;

    const year = reviewYear(burger);
    if (year != null) {
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
      if (year === currentYear) reviewsThisYear += 1;
    }
  }

  const averageScore =
    scores.length > 0
      ? scores.reduce((acc, value) => acc + value, 0) / scores.length
      : 0;

  let busiestYear: BurgerCollectionStats['busiestYear'] = null;
  for (const [year, count] of yearCounts) {
    if (!busiestYear || count > busiestYear.count) {
      busiestYear = { year, count };
    }
  }

  return {
    uniqueVenues: venueSet.size,
    averageScore,
    eliteCount,
    reviewsThisYear,
    busiestYear,
  };
}

export function formatStatScore(value: number): string {
  return value.toFixed(1);
}
