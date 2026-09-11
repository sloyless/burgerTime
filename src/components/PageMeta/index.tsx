import Head from 'next/head';
import { useRouter } from 'next/router';

import { getSiteName, toAbsoluteUrl } from 'utils/siteUrl';

const DEFAULT_DESCRIPTION =
  "One man's journey to eat every cheeseburger in the world. (Mostly NYC.)";

const DEFAULT_SHARE_IMAGE = '/logo.png';

type OgType = 'website' | 'article';

type Props = {
  description?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
  /** ISO 8601 — used for article pages (burger reviews). */
  publishedTime?: string;
  title: string;
  type?: OgType;
  /** Override canonical path (defaults to current route without query string). */
  canonicalPath?: string;
};

function PageMeta({
  canonicalPath,
  description = DEFAULT_DESCRIPTION,
  image,
  imageAlt,
  jsonLd,
  noIndex = false,
  publishedTime,
  title,
  type = 'website',
}: Readonly<Props>) {
  const router = useRouter();
  const pageTitle = title.includes('BurgerTime')
    ? title
    : `${title} :: ${getSiteName()}`;

  const path =
    canonicalPath ?? (router.asPath.split('?')[0].split('#')[0] || '/');
  const canonicalUrl = toAbsoluteUrl(path);
  const shareImage = toAbsoluteUrl(image ?? DEFAULT_SHARE_IMAGE);
  const shareImageAlt = imageAlt ?? pageTitle;
  const twitterCard = image ? 'summary_large_image' : 'summary';

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={getSiteName()} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={shareImage} />
      <meta property="og:image:alt" content={shareImageAlt} />

      {type === 'article' && publishedTime ? (
        <meta property="article:published_time" content={publishedTime} />
      ) : null}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={shareImage} />
      <meta name="twitter:image:alt" content={shareImageAlt} />

      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      ) : null}
    </Head>
  );
}

export default PageMeta;
