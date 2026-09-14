import dynamic from 'next/dynamic';

import BurgerPageMeta from 'components/BurgerPageMeta';
import PageMeta from 'components/PageMeta';
import BurgerDetailSkeleton from 'components/BurgerDetailSkeleton';
import { Layout } from 'layout';
import type { BurgerDetailPageProps } from 'libs/burgerDetailPageProps';
import { serverBurgerToBurger } from 'utils/serverBurger';

export { getBurgerDetailServerSideProps as getServerSideProps } from 'libs/burgerDetailPageProps';

const BurgerPageClient = dynamic(() => import('components/BurgerPageClient'), {
  ssr: false,
  loading: () => (
    <Layout padding={false}>
      <BurgerDetailSkeleton />
    </Layout>
  ),
});

export default function BurgerPage({
  slug,
  initialBurger,
}: BurgerDetailPageProps) {
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
