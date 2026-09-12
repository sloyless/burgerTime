import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { getBurgerUrlSegmentFromAsPath } from 'utils/burgerUrlSegment';

/**
 * Burger detail URLs on Firebase static hosting must be read from the browser
 * path. Next's `router.query.slug` is often the template `[slug]`, not the
 * segment in the address bar.
 */
export function useBurgerUrlSegment(): string {
  const router = useRouter();
  const [segment, setSegment] = useState('');

  const sync = useCallback(() => {
    if (typeof window === 'undefined') return;
    setSegment(getBurgerUrlSegmentFromAsPath(window.location.pathname));
  }, []);

  useEffect(() => {
    sync();
    router.events.on('routeChangeComplete', sync);
    return () => {
      router.events.off('routeChangeComplete', sync);
    };
  }, [router.events, sync]);

  return segment;
}
