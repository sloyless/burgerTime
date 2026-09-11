const SITE_NAME = 'BurgerTime';

export const DEFAULT_SITE_ORIGIN = 'https://burgertime.app';

/** Canonical site origin for meta tags and share URLs. Override with `NEXT_PUBLIC_SITE_URL`. */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_SITE_ORIGIN;
}

export function getSiteName(): string {
  return SITE_NAME;
}

/** Build an absolute URL for meta tags (og:image, og:url, canonical). */
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteOrigin()}${path}`;
}
