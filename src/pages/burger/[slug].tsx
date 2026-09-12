import BurgerPageClient from 'components/BurgerPageClient';

/** Static shell; slug is read from `window.location` in the client (see useBurgerUrlSegment). */
export default function BurgerPage() {
  return <BurgerPageClient />;
}
