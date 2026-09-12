import {
  doc,
  getDoc,
  runTransaction,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

import { getBurgerPath } from 'utils/burgerSlug';
import { database } from 'utils/firebase';
import type { Burger } from 'utils/types';
import { getSiteOrigin } from 'utils/siteUrl';

const SITEMAP_DOC_PATH = 'meta/sitemap';

export type SitemapUrl = {
  path: string;
  lastmod?: string;
};

export type SitemapDoc = {
  version: 1;
  urls: SitemapUrl[];
  updatedAt: Timestamp;
};

const STATIC_PATHS: SitemapUrl[] = [{ path: '/' }, { path: '/about' }];

function reviewLastmod(burger: Burger): string | undefined {
  const seconds = (burger.timestamp as { seconds?: number } | undefined)
    ?.seconds;
  if (seconds == null) return undefined;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function burgerSitemapUrl(burger: Burger): SitemapUrl | null {
  const path = getBurgerPath(burger);
  if (!path) return null;
  return {
    path,
    lastmod: reviewLastmod(burger),
  };
}

function sortSitemapUrls(urls: SitemapUrl[]): SitemapUrl[] {
  return [...urls].sort((a, b) => a.path.localeCompare(b.path));
}

export async function rebuildSitemap(burgers: Burger[]): Promise<void> {
  const burgerUrls = burgers
    .map(burgerSitemapUrl)
    .filter((url): url is SitemapUrl => url != null);

  const docBody: SitemapDoc = {
    version: 1,
    urls: sortSitemapUrls([...STATIC_PATHS, ...burgerUrls]),
    updatedAt: Timestamp.now(),
  };

  await writeBatch(database)
    .set(doc(database, SITEMAP_DOC_PATH), docBody)
    .commit();
}

function upsertBurgerUrl(urls: SitemapUrl[], burger: Burger): SitemapUrl[] {
  const next = burgerSitemapUrl(burger);
  if (!next) return urls;

  const without = urls.filter(
    (item) =>
      item.path !== next.path &&
      !item.path.endsWith(`/burger/${burger.id}`) &&
      !(burger.slug && item.path === `/burger/${burger.slug}`)
  );

  return sortSitemapUrls([...without, next]);
}

function ensureStaticUrls(urls: SitemapUrl[]): SitemapUrl[] {
  const paths = new Set(urls.map((item) => item.path));
  const merged = [...urls];
  for (const staticUrl of STATIC_PATHS) {
    if (!paths.has(staticUrl.path)) {
      merged.push(staticUrl);
    }
  }
  return sortSitemapUrls(merged);
}

async function ensureSitemapReady(): Promise<boolean> {
  const ref = doc(database, SITEMAP_DOC_PATH);
  const existing = await getDoc(ref);
  if (existing.exists()) return true;

  const summary = await getDoc(doc(database, 'meta', 'collectionSummary'));
  if (!summary.exists()) return false;

  const { rebuildSiteMeta } = await import('libs/siteMetaRebuild');
  await rebuildSiteMeta();
  return true;
}

export async function syncSitemapAfterCreate(burger: Burger): Promise<void> {
  if (!(await ensureSitemapReady())) return;

  const ref = doc(database, SITEMAP_DOC_PATH);

  try {
    await runTransaction(database, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) return;
      const body = snap.data() as SitemapDoc;
      const urls = ensureStaticUrls(upsertBurgerUrl(body.urls ?? [], burger));
      transaction.set(ref, {
        ...body,
        urls,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Sitemap create sync failed:', error);
  }
}

export async function syncSitemapAfterUpdate(burger: Burger): Promise<void> {
  await syncSitemapAfterCreate(burger);
}

export async function fetchSitemapDoc(): Promise<SitemapDoc | null> {
  const snap = await getDoc(doc(database, SITEMAP_DOC_PATH));
  if (!snap.exists()) return null;
  return snap.data() as SitemapDoc;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sitemapDocToXml(
  sitemap: SitemapDoc,
  origin = getSiteOrigin()
): string {
  const urlNodes = sitemap.urls
    .map((item) => {
      const loc = `${origin}${item.path.startsWith('/') ? item.path : `/${item.path}`}`;
      const lastmod = item.lastmod
        ? `\n    <lastmod>${item.lastmod}</lastmod>`
        : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
}
