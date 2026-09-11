import { BurgerFormValues } from './types';

export function isBurgerFormComplete(values: BurgerFormValues): boolean {
  return Boolean(
    values.venue &&
      values.address &&
      values.burgerName &&
      values.appearance &&
      values.bun &&
      values.cheese &&
      values.meat &&
      values.sauce &&
      values.veg
  );
}
