import { memo } from 'react';
import Link from 'next/link';
import BurgerPhoto from 'components/BurgerPhoto';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

import {
  calculateTimestamp,
  getDisplayScore,
  getFormattedDate,
} from 'functions';

import { DocumentData } from 'firebase/firestore';
import LocationLink from 'components/LocationLink';
import ScoreBadge from 'components/ScoreBadge';
import { Burger } from 'utils/types';
import { getBurgerPath } from 'utils/burgerSlug';

type Props = {
  burger: DocumentData;
  compact?: boolean;
  featured?: boolean;
  imagePriority?: boolean;
  url: string;
};

function Card({
  burger,
  compact = false,
  featured = false,
  imagePriority = false,
  url,
}: Readonly<Props>) {
  if (!burger) return;

  const displayScore = getDisplayScore(burger as Burger);
  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();

  if (compact) {
    return (
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <Link
          href={url}
          className="group flex min-h-0 flex-1 cursor-pointer flex-col"
          title={`${burger.burgerName} at ${burger.venue}`}
        >
          <div className="relative aspect-5/3 w-full shrink-0 overflow-hidden bg-stone-100">
            {burger.image ? (
              <BurgerPhoto
                src={burger.image}
                alt={burger.burgerName ?? burger.venue ?? 'Burger'}
                layout="cardCompact"
                priority={imagePriority}
                className="group-hover:scale-1.02 object-cover transition-transform duration-300"
              />
            ) : null}
            <div className="absolute right-2 bottom-2 z-10">
              <ScoreBadge compact score={displayScore} />
            </div>
          </div>
          <div className="min-w-0 p-3">
            <h3 className="font-venue line-clamp-2 text-base leading-snug text-brand-700">
              {burger.venue}
            </h3>
            {timestampDate ? (
              <time
                className="mt-1 block font-sans text-xs text-stone-500"
                dateTime={timestampISO}
              >
                {getFormattedDate(timestampDate)}
              </time>
            ) : null}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article
      className={`max-w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        featured
          ? 'border-orange-200 ring-2 ring-orange-100'
          : 'border-stone-200'
      }`}
    >
      <div className={featured ? '' : 'lg:flex lg:min-h-48 lg:items-stretch'}>
        {burger.image && (
          <Link
            className={`group relative block aspect-5/3 w-full cursor-pointer overflow-hidden bg-stone-100 ${
              featured
                ? ''
                : 'lg:aspect-auto lg:h-full lg:min-h-48 lg:w-2/5 lg:shrink-0'
            }`}
            href={url}
            title={`${burger.burgerName} at ${burger.venue}`}
          >
            <BurgerPhoto
              src={burger.image}
              alt={burger.burgerName}
              layout={featured ? 'featured' : 'cardFull'}
              priority={imagePriority}
              className="group-hover:scale-1.02 object-cover transition-transform duration-300"
            />
          </Link>
        )}
        <div className={`min-w-0 p-5 ${featured ? '' : 'lg:flex-1'}`}>
          <div className="flex min-w-0 flex-row gap-4">
            <div className="min-w-0 flex-1">
              <Link
                className="block cursor-pointer text-brand-700 hover:text-brand-800"
                href={getBurgerPath(burger as Burger)}
              >
                <h3
                  className={`font-venue leading-tight ${
                    featured ? 'text-3xl' : 'text-2xl'
                  }`}
                >
                  {burger.venue}
                  {displayScore > 94 && (
                    <span className="ml-1 inline-block text-amber-500">
                      <FontAwesomeIcon icon={faStar} size="sm" />
                    </span>
                  )}
                </h3>
              </Link>
              {timestampDate ? (
                <time
                  className="mt-1 block font-sans text-xs text-stone-500"
                  dateTime={timestampISO}
                >
                  {getFormattedDate(timestampDate)}
                </time>
              ) : null}
              <hr className="my-2 border-stone-200" />
              <LocationLink burger={burger} />
            </div>
            <ScoreBadge score={displayScore} />
          </div>
          <p
            className={`mt-4 min-w-0 text-stone-700 ${
              featured ? 'text-lg' : 'line-clamp-2 text-sm'
            }`}
          >
            <span className="font-bold text-stone-900 italic">
              {burger.burgerName}
            </span>
            {burger?.notes && <span>: {burger.notes}</span>}
          </p>
        </div>
      </div>
    </article>
  );
}

export default memo(Card);
