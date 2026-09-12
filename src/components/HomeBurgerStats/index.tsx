import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ReactNode } from 'react';

import { type BurgerCollectionStats, formatStatScore } from 'libs/burgerStats';

type Props = {
  stats: BurgerCollectionStats;
};

function StatsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconDefinition;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-stone-900">
        <FontAwesomeIcon
          icon={icon}
          size="sm"
          className="size-3.5 text-brand-700"
        />
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900 tabular-nums">{value}</span>
    </div>
  );
}

function HomeBurgerStats({ stats }: Readonly<Props>) {
  const currentYear = new Date().getUTCFullYear();

  return (
    <div className="mt-4 space-y-4">
      <StatsCard title="Burger stats" icon={faChartColumn}>
        <dl className="space-y-2 font-sans">
          <StatRow
            label="Average score"
            value={formatStatScore(stats.averageScore)}
          />
          <StatRow label="Unique venues" value={String(stats.uniqueVenues)} />
          <StatRow label="90+ club" value={String(stats.eliteCount)} />
          {stats.reviewsThisYear > 0 ? (
            <StatRow
              label={`Reviews in ${currentYear}`}
              value={String(stats.reviewsThisYear)}
            />
          ) : null}
          {stats.busiestYear ? (
            <StatRow
              label="Busiest year"
              value={`${stats.busiestYear.year} (${stats.busiestYear.count} reviews)`}
            />
          ) : null}
        </dl>
      </StatsCard>
    </div>
  );
}

export default HomeBurgerStats;
