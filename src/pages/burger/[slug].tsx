import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import BurgerPageMeta from 'components/BurgerPageMeta';
import PageMeta from 'components/PageMeta';
import BurgerDetailSkeleton from 'components/BurgerDetailSkeleton';
import { Layout } from 'layout';
import { resolveBurgerByUrlSegmentAdmin } from 'libs/resolveBurgerAdmin';
import { getBurgerPath } from 'utils/burgerPaths';
import { isValidBurgerUrlSegment } from 'utils/burgerUrlSegment';
import type { ServerBurger } from 'utils/serverBurger';
import { serverBurgerToBurger } from 'utils/serverBurger';

const BurgerPageClient = dynamic(() => import('components/BurgerPageClient'), {
  ssr: false,
  loading: () => (
    <Layout padding={false}>
      <BurgerDetailSkeleton />
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
        <BurgerPageMeta
          burger={serverBurgerToBurger(initialBurger)}
          urlSegment={slug}
        />
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
    const burger = await resolveBurgerByUrlSegmentAdmin(slug);
    if (!burger) {
      return { notFound: true };
    }

    const canonicalPath = getBurgerPath(serverBurgerToBurger(burger));
    const canonicalSegment = canonicalPath.replace(/^\/burger\//, '');
    if (canonicalSegment && canonicalSegment !== slug) {
      return {
        redirect: {
          destination: canonicalPath,
          permanent: true,
        },
      };
    }

    return { props: { slug, initialBurger: burger } };
  } catch (error) {
    console.error('Server burger resolve failed:', error);
    return { props: { slug, initialBurger: null } };
  }
};
