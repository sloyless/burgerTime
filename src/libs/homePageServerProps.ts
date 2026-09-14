import type { GetStaticProps } from 'next';

import { fetchHomePageAdmin } from 'libs/fetchHomePageAdmin';
import {
  HOME_PAGE_SIZE,
  type HomePageInitialData,
  type HomePageProps,
} from 'libs/homePageTypes';

/** ISR: regenerate home page 1 data periodically on Hosting/Node. */
export const HOME_PAGE_REVALIDATE_SECONDS = 120;

function toInitialData(
  data: Awaited<ReturnType<typeof fetchHomePageAdmin>>
): HomePageInitialData {
  const listPagination =
    data.totalPages > 1 && data.nextPageCursorEncoded
      ? {
          next: `/?page=2&after=${encodeURIComponent(data.nextPageCursorEncoded)}`,
        }
      : undefined;

  return {
    count: data.count,
    totalPages: data.totalPages,
    nextPageCursorEncoded: data.nextPageCursorEncoded,
    pageItems: data.pageItems,
    topTen: data.topTen,
    stats: data.stats,
    listPagination,
  };
}

export const getHomeStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const data = await fetchHomePageAdmin(HOME_PAGE_SIZE);
    return {
      props: { initialHome: toInitialData(data) },
      revalidate: HOME_PAGE_REVALIDATE_SECONDS,
    };
  } catch (error) {
    console.error('Home page static props failed:', error);
    return {
      props: { initialHome: null },
      revalidate: 60,
    };
  }
};
