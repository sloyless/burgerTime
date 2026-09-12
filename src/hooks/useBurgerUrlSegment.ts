import { useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/router';

import { getBurgerUrlSegmentFromAsPath } from 'utils/burgerUrlSegment';

function getServerSnapshot(): string {
  return '';
}

/**
 * Burger detail URLs on Firebase static hosting must be read from the browser
 * path. Next's `router.query.slug` is often the template `[slug]`, not the
 * segment in the address bar.
 */
export function useBurgerUrlSegment(): string {
  const router = useRouter();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      router.events.on('routeChangeComplete', onStoreChange);
      return () => {
        router.events.off('routeChangeComplete', onStoreChange);
      };
    },
    [router.events]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return getBurgerUrlSegmentFromAsPath(window.location.pathname);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
