import { calculateTimestamp, getDisplayScore } from 'functions';
import { getBurgerPath, getCanonicalBurgerSlug } from 'utils/burgerPaths';
import type { Burger } from 'utils/types';

export type BurgerPageMetaFields = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type: 'article';
  publishedTime?: string;
  canonicalPath: string;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
};

export function buildBurgerPageMeta(
  burger: Burger,
  urlSegment: string,
  options?: { noIndex?: boolean }
): BurgerPageMetaFields {
  const score = getDisplayScore(burger as Burger);
  const pageTitle = `${burger.venue ?? 'Review'} — ${burger.burgerName ?? 'Burger'}`;
  const metaDescription = burger.notes
    ? String(burger.notes).slice(0, 160)
    : `Burger review at ${burger.venue ?? 'unknown venue'}. Score: ${score}.`;
  const metaImage =
    burger.image && typeof burger.image === 'string' ? burger.image : undefined;
  const reviewTimestamp = burger.timestamp
    ? calculateTimestamp(
        (burger.timestamp as { seconds?: number }).seconds ?? 0
      )
    : undefined;
  const publishedTime =
    reviewTimestamp && !Number.isNaN(reviewTimestamp.getTime())
      ? reviewTimestamp.toISOString()
      : undefined;
  const canonicalSlug = burger.slug ?? getCanonicalBurgerSlug(burger as Burger);
  const canonicalPath = getBurgerPath({
    ...(burger as Burger),
    slug: canonicalSlug,
    id: burger.id,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: burger.burgerName ?? 'Burger review',
    reviewBody: burger.notes
      ? String(burger.notes).slice(0, 5000)
      : metaDescription,
    datePublished: publishedTime,
    itemReviewed: {
      '@type': 'FoodEstablishment',
      name: burger.venue ?? 'Restaurant',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: score,
      bestRating: 100,
      worstRating: 0,
    },
    ...(metaImage ? { image: metaImage } : {}),
  };

  return {
    title: pageTitle,
    description: metaDescription,
    image: metaImage,
    imageAlt: `${burger.burgerName ?? 'Burger'} at ${burger.venue ?? 'venue'} — score ${score}`,
    type: 'article',
    publishedTime,
    canonicalPath: canonicalPath || `/burger/${urlSegment}`,
    jsonLd,
    noIndex: options?.noIndex,
  };
}
