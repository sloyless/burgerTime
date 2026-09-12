const PRICE_TIERS = [
  { count: 1, label: '$1-5' },
  { count: 2, label: '$5-12' },
  { count: 3, label: '$12-20' },
  { count: 4, label: '$20-40' },
  { count: 5, label: '> $40' },
] as const;

function BurgerPriceLegend() {
  return (
    <ul className="flex flex-col gap-1">
      {PRICE_TIERS.map((tier) => (
        <li key={tier.label}>
          <span className="font-medium text-brand-600">
            {'$'.repeat(tier.count)}
          </span>
          <span className="text-stone-600"> - {tier.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default BurgerPriceLegend;
