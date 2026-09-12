import { useRouter } from 'next/router';

import BurgerPageClient from 'components/BurgerPageClient';
import PageMeta from 'components/PageMeta';
import PageLoading from 'components/PageLoading';
import { Layout } from 'layout';
import { getBurgerUrlSegmentFromRouter } from 'utils/burgerUrlSegment';

export default function BurgerPage() {
  const router = useRouter();
  const slug = router.isReady ? getBurgerUrlSegmentFromRouter(router) : '';

  const canonicalPath = slug ? `/burger/${slug}` : '/burger';

  if (!router.isReady || !slug) {
    return (
      <Layout padding={false}>
        <PageMeta title="Burger review" canonicalPath={canonicalPath} />
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
