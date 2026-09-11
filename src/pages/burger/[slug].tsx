import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import PageMeta from 'components/PageMeta';
import PageLoading from 'components/PageLoading';
import { Layout } from 'layout';
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
};

export default function BurgerPage({ slug }: PageProps) {
  return <BurgerPageClient slug={slug} />;
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

  return { props: { slug } };
};
