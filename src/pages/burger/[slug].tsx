import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import BurgerPageMeta from 'components/BurgerPageMeta';
import PageMeta from 'components/PageMeta';
import PageLoading from 'components/PageLoading';
import { Layout } from 'layout';
import type { ServerBurger } from 'utils/serverBurger';
import { isValidBurgerUrlSegment } from 'utils/burgerSlug';

const BurgerPageClient = dynamic(() => import('components/BurgerPageClient'), {
  ssr: false,
  loading: () => (
    <Layout padding={false}>
      <PageMeta title="Burger review" />
      <PageLoading tip="Loading review…" />
    </Layout>
  ),
});

type PageProps = {
  slug: string;
  initialBurger: ServerBurger | null;
};

export default function BurgerPage({ slug, initialBurger }: PageProps) {
  return (
    <>
      {initialBurger ? (
        <BurgerPageMeta burger={initialBurger} urlSegment={slug} />
      ) : (
        <PageMeta title="Burger review" canonicalPath={`/burger/${slug}`} />
      )}
      <BurgerPageClient slug={slug} initialBurger={initialBurger} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const raw = context.params?.slug;
  if (!raw || typeof raw !== 'string') {
    return { notFound: true };
  }

  let slug: string;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    return { notFound: true };
  }

  if (!isValidBurgerUrlSegment(slug)) {
    return { notFound: true };
  }

  try {
    const { resolveBurgerByUrlSegment } = await import(
      'libs/resolveBurgerAdmin'
    );
    const burger = await resolveBurgerByUrlSegment(slug);
    if (!burger) {
      return { notFound: true };
    }
    return { props: { slug, initialBurger: burger } };
  } catch (error) {
    console.error('Server burger resolve failed:', error);
    return { props: { slug, initialBurger: null } };
  }
};
