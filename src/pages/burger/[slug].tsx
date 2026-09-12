import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import PageMeta from 'components/PageMeta';
import PageLoading from 'components/PageLoading';
import { Layout } from 'layout';

const BurgerPageClient = dynamic(() => import('components/BurgerPageClient'), {
  ssr: false,
  loading: () => (
    <Layout padding={false}>
      <PageMeta title="Burger review" />
      <PageLoading tip="Loading review…" />
    </Layout>
  ),
});

export default function BurgerPage() {
  const router = useRouter();
  const slug =
    typeof router.query.slug === 'string' ? router.query.slug : '';

  const canonicalPath = slug ? `/burger/${slug}` : '/burger';

  if (!router.isReady) {
    return (
      <Layout padding={false}>
        <PageMeta title="Burger review" canonicalPath={canonicalPath} />
        <PageLoading tip="Loading review…" />
      </Layout>
    );
  }

  if (!slug) {
    return (
      <Layout padding={false}>
        <PageMeta title="Burger review" noIndex />
        <PageLoading tip="Loading review…" />
      </Layout>
    );
  }

  return (
    <>
      <PageMeta title="Burger review" canonicalPath={canonicalPath} />
      <BurgerPageClient slug={slug} />
    </>
  );
}
