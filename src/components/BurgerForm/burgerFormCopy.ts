export const BURGER_RATING_FIELDS = [
  {
    key: 'appearance' as const,
    label: 'Appearance',
    description:
      'How was the presentation of the burger? Perfectly crafted? Shoved into a fast food wrapper?',
  },
  {
    key: 'bun' as const,
    label: 'Bun',
    description:
      "If a great burger is a classic painting, then the bun is the frame. It's the handle. It's the rhythm section. It's the wrapping that brings the whole thing together.",
  },
  {
    key: 'meat' as const,
    label: 'Meat',
    description:
      'The burger itself. This category covers flavor, texture, juiciness, and done-ness.',
  },
  {
    key: 'cheese' as const,
    label: 'Cheese',
    description: 'How was the cheese? Meltiness, quality, quantity, etc.',
  },
  {
    key: 'veg' as const,
    label: 'Vegetables',
    description:
      'This covers lettuce, onion, tomato, pickle, peppers, kimchi, and anything else that might be used to dress up the burger in question.',
  },
  {
    key: 'sauce' as const,
    label: 'Sauces',
    description:
      'Ketchup, mustard, aoli, peanut butter, special sauce, or anything spreadable on the burger.',
  },
];

export const COOK_TYPE_OPTIONS = [
  'Grill',
  'Griddle',
  'Flat top',
  'Broiler',
  'Smoker',
] as const;

export function cookTypeSelectOptions(current?: string) {
  const options: { value: string; label: string }[] = COOK_TYPE_OPTIONS.map(
    (value) => ({
      value,
      label: value,
    })
  );

  if (
    current &&
    !COOK_TYPE_OPTIONS.includes(current as (typeof COOK_TYPE_OPTIONS)[number])
  ) {
    options.push({ value: current, label: current });
  }

  return options;
}
