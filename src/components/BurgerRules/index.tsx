function BurgerRules() {
  const tiers = [
    {
      range: '95–100',
      className: 'bg-green-900',
      blurb: 'I could eat this burger every day for the rest of my life.',
    },
    {
      range: '80–95',
      className: 'bg-green-600',
      blurb: 'This is, excuse me, a damn fine burger.',
    },
    {
      range: '50–80',
      className: 'bg-yellow-500',
      blurb: 'This is a decent burger.',
    },
    {
      range: '20–50',
      className: 'bg-orange-500',
      blurb: 'Glad I ate it once so I never have to again.',
    },
    {
      range: '< 20',
      className: 'bg-red-900',
      blurb: 'Send this back to the nightmare it came from.',
    },
  ];

  return (
    <aside className="mt-8 w-full shrink-0 self-start font-sans md:mt-0 md:w-56 lg:w-64 xl:w-80">
      <div className="rounded-2xl border border-stone-700 bg-stone-900 p-5 text-stone-100 shadow-lg md:sticky md:top-24">
        <h2 className="mb-4 font-serif text-lg font-bold text-white">
          How scoring works
        </h2>
        <ul className="space-y-3">
          {tiers.map((tier) => (
            <li key={tier.range} className="flex gap-3">
              <div
                className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-md text-center text-[10px] font-bold leading-tight text-white ${tier.className}`}
              >
                {tier.range}
              </div>
              <p className="text-xs leading-snug text-stone-300">{tier.blurb}</p>
            </li>
          ))}
        </ul>
        <hr className="my-4 border-stone-700" />
        <h3 className="mb-2 font-serif text-base font-bold text-white">
          Score breakdown
        </h3>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-400">
          <dt>Appearance</dt>
          <dd className="text-right text-stone-200">5 pts max</dd>
          <dt>Bun</dt>
          <dd className="text-right text-stone-200">15 pts max</dd>
          <dt>Meat</dt>
          <dd className="text-right text-stone-200">30 pts max</dd>
          <dt>Cheese</dt>
          <dd className="text-right text-stone-200">25 pts max</dd>
          <dt>Vegetables</dt>
          <dd className="text-right text-stone-200">15 pts max</dd>
          <dt>Sauces</dt>
          <dd className="text-right text-stone-200">10 pts max</dd>
        </dl>
      </div>
    </aside>
  );
}

export default BurgerRules;
