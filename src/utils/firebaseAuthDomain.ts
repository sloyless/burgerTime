const PROJECT_AUTH_HANDLER_HOST = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
  : 'burgertime-48011.firebaseapp.com';

const CUSTOM_SITE_HOSTS = new Set(['burgertime.app', 'www.burgertime.app']);

/** Use the site hostname as authDomain on production (OAuth return stays on-site). */
export function resolveClientAuthDomain(): string {
  const configured =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? PROJECT_AUTH_HANDLER_HOST;

  if (typeof window === 'undefined') {
    return configured;
  }

  const hostname = window.location.hostname;
  if (CUSTOM_SITE_HOSTS.has(hostname)) {
    return hostname === 'www.burgertime.app' ? 'burgertime.app' : hostname;
  }

  return configured;
}

export { PROJECT_AUTH_HANDLER_HOST };
