import type { GetServerSideProps } from 'next';

import { resolveBurgerByUrlSegment } from 'libs/resolveBurgerAdmin';
import { getBurgerPath } from 'utils/burgerPaths';
import { parseBurgerSlugParam } from 'utils/burgerUrlSegment';
import type { ServerBurger } from 'utils/serverBurger';
import { serverBurgerToBurger } from 'utils/serverBurger';

export type BurgerDetailPageProps = {
  slug: string;
  initialBurger: ServerBurger | null;
};

export const getBurgerDetailServerSideProps: GetServerSideProps<
  BurgerDetailPageProps
> = async (context) => {
  const slug = parseBurgerSlugParam(context.params?.slug);
  if (!slug) {
    return { notFound: true };
  }

  try {
    const burger = await resolveBurgerByUrlSegment(slug);
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
