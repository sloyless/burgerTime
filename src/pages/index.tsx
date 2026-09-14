import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Pagination, Result } from 'antd';
import { Layout } from 'layout';
import Divider from 'components/Divider';
import SectionHeading from 'components/SectionHeading';
import HomeReviewList from 'components/HomeReviewList';
import PageMeta from 'components/PageMeta';
import type { Burger } from 'utils/types';
import Card from 'components/Card';
import EmptyState from 'components/EmptyState';
import HomePageSkeleton from 'components/HomePageSkeleton';
import Button from 'components/Button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import HomeBurgerStats from 'components/HomeBurgerStats';
import SiteWordmark from 'components/SiteWordmark';
import { fetchHomePageData } from 'libs/burgerQueries';
import {
  HOME_PAGE_SIZE,
  type HomePageInitialData,
  type HomePageProps,
} from 'libs/homePageTypes';
import type { BurgerCollectionStats } from 'libs/burgerStats';
import {
  readStoredPageCursors,
  writeStoredPageCursors,
} from 'libs/reviewPageCursorStorage';
import { getBurgerPath } from 'utils/burgerSlug';
import {
  buildTopTenPathLookup,
  isBurgerInTopTenLookup,
} from 'libs/topTenMatch';
import { serverBurgerToBurger } from 'utils/serverBurger';

export { getHomeStaticProps as getStaticProps } from 'libs/homePageServerProps';

const PAGE_SIZE = HOME_PAGE_SIZE;

function homeReviewListPath(
  page: number,
  cursors: Map<number, string>
): string {
  if (page <= 1) return '/';
  const after = cursors.get(page);
  if (after) {
    return `/?page=${page}&after=${encodeURIComponent(after)}`;
  }
  return `/?page=${page}`;
}

function burgersFromInitial(initial: HomePageInitialData): {
  pageItems: Burger[];
  topTen: Burger[];
} {
  return {
    pageItems: initial.pageItems.map(serverBurgerToBurger),
    topTen: initial.topTen.map(serverBurgerToBurger),
  };
}

function useInitialHomePage(initialHome: HomePageInitialData | null) {
  const router = useRouter();
  const requestedPage = Number(router.query.page) || 1;
  const afterParam =
    typeof router.query.after === 'string' ? router.query.after : undefined;
  const useServerPageOne =
    initialHome != null && requestedPage <= 1 && !afterParam;

  return { requestedPage, afterParam, useServerPageOne };
}

const Home: NextPage<HomePageProps> = ({ initialHome }) => {
  const router = useRouter();
  const { requestedPage, afterParam, useServerPageOne } =
    useInitialHomePage(initialHome);

  const seeded = useServerPageOne && initialHome ? initialHome : null;
  const seededBurgers = seeded ? burgersFromInitial(seeded) : null;

  const [loading, setLoading] = useState(!useServerPageOne);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [pageItems, setPageItems] = useState<Burger[]>(
    () => seededBurgers?.pageItems ?? []
  );
  const [topTenBurgers, setTopTenBurgers] = useState<Burger[]>(
    () => seededBurgers?.topTen ?? []
  );
  const [collectionStats, setCollectionStats] =
    useState<BurgerCollectionStats | null>(() => seeded?.stats ?? null);
  const [totalReviews, setTotalReviews] = useState(() => seeded?.count ?? 0);
  const [listPagination, setListPagination] = useState<
    HomePageInitialData['listPagination']
  >(() => seeded?.listPagination);
  const pageCursorsRef = useRef<Map<number, string>>(new Map());
  const cursorsHydratedRef = useRef(false);
  const skippedInitialClientFetchRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(totalReviews / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

  const topTenPaths = useMemo(
    () => buildTopTenPathLookup(topTenBurgers),
    [topTenBurgers]
  );

  const loadHome = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (cursorsHydratedRef.current) return;
    cursorsHydratedRef.current = true;
    for (const [page, cursor] of readStoredPageCursors()) {
      pageCursorsRef.current.set(page, cursor);
    }
    if (seeded?.nextPageCursorEncoded) {
      pageCursorsRef.current.set(2, seeded.nextPageCursorEncoded);
      writeStoredPageCursors(pageCursorsRef.current);
    }
  }, [seeded?.nextPageCursorEncoded]);

  useEffect(() => {
    if (!router.isReady) return;

    const page = Math.max(1, requestedPage);
    if (page <= 1 || afterParam) return;

    const cursor =
      pageCursorsRef.current.get(page) ?? readStoredPageCursors().get(page);

    if (cursor) {
      void router.replace(
        { pathname: '/', query: { page: String(page), after: cursor } },
        undefined,
        { shallow: true }
      );
    }
  }, [router.isReady, requestedPage, afterParam, router]);

  useEffect(() => {
    if (!router.isReady) return;

    const page = Math.max(1, requestedPage);

    if (
      reloadToken === 0 &&
      page <= 1 &&
      !afterParam &&
      initialHome &&
      !skippedInitialClientFetchRef.current
    ) {
      skippedInitialClientFetchRef.current = true;
      return;
    }

    if (page > 1 && !afterParam) {
      const cursor =
        pageCursorsRef.current.get(page) ?? readStoredPageCursors().get(page);
      if (!cursor) {
        void router.replace('/', undefined, { shallow: true });
        return;
      }
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setLoadError(true);
      }
    }, 10000);

    void (async () => {
      try {
        const data = await fetchHomePageData(page, PAGE_SIZE, {
          afterParam,
          storedCursors: pageCursorsRef.current,
        });

        if (cancelled) return;

        for (const [cursorPage, cursor] of data.discoveredCursors) {
          pageCursorsRef.current.set(cursorPage, cursor);
        }
        writeStoredPageCursors(pageCursorsRef.current);

        if (page > 1 && !afterParam) {
          const cursorForPage = pageCursorsRef.current.get(page);
          if (cursorForPage) {
            void router.replace(
              {
                pathname: '/',
                query: { page: String(page), after: cursorForPage },
              },
              undefined,
              { shallow: true }
            );
          }
        }

        if (data.count > 0 && page > data.totalPages) {
          void router.replace(
            data.totalPages === 1 ? '/' : `/?page=${data.totalPages}`,
            undefined,
            { shallow: true }
          );
          return;
        }

        if (data.nextPageCursorEncoded && page < data.totalPages) {
          pageCursorsRef.current.set(page + 1, data.nextPageCursorEncoded);
          writeStoredPageCursors(pageCursorsRef.current);
        }

        setTotalReviews(data.count);
        setTopTenBurgers(data.topTen);
        if (data.stats) {
          setCollectionStats(data.stats);
        }
        setPageItems(data.count > 0 ? data.pageItems : []);
        setListPagination(
          data.totalPages > 1
            ? {
                prev:
                  page > 1
                    ? homeReviewListPath(page - 1, pageCursorsRef.current)
                    : undefined,
                next:
                  page < data.totalPages
                    ? homeReviewListPath(page + 1, pageCursorsRef.current)
                    : undefined,
              }
            : undefined
        );
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load burgers:', error);
          setLoadError(true);
          setTotalReviews(0);
          setTopTenBurgers([]);
          setPageItems([]);
          setListPagination(undefined);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    router.isReady,
    requestedPage,
    afterParam,
    reloadToken,
    router,
    initialHome,
  ]);

  function goToPage(page: number) {
    if (page === 1) {
      void router.push('/', undefined, { shallow: true });
    } else {
      const after = pageCursorsRef.current.get(page);
      const query: { page: string; after?: string } = { page: String(page) };
      if (after) {
        query.after = after;
      }
      void router.push({ pathname: '/', query }, undefined, { shallow: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  let content;
  if (loading) {
    content = <HomePageSkeleton />;
  } else if (loadError) {
    content = (
      <div className="flex w-full flex-1 justify-center py-12 font-sans">
        <Result
          status="error"
          title="Couldn't load reviews"
          subTitle="Check your connection and try again."
          extra={
            <Button type="button" status="primary" onClick={loadHome}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (totalReviews > 0) {
    const featuredItem = currentPage === 1 ? pageItems[0] : undefined;
    const listItems = currentPage === 1 ? pageItems.slice(1) : pageItems;

    content = (
      <>
        <div className="min-w-0 flex-1 space-y-8 lg:pr-10">
          <SectionHeading>Latest reviews</SectionHeading>
          {featuredItem ? (
            <Card
              key={featuredItem.id}
              featured
              imagePriority
              burger={featuredItem}
              inTopTen={isBurgerInTopTenLookup(featuredItem, topTenPaths)}
              url={getBurgerPath(featuredItem)}
            />
          ) : null}
          <HomeReviewList listItems={listItems} topTenPaths={topTenPaths} />
          {totalPages > 1 && (
            <div className="flex justify-center pt-4 font-sans">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={totalReviews}
                onChange={goToPage}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}–${range[1]} of ${total} reviews`
                }
              />
            </div>
          )}
        </div>
        <aside className="mt-10 min-w-0 lg:mt-0 lg:w-80 lg:shrink-0">
          <div className="lg:hidden">
            <Divider />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-stone-900">
              <FontAwesomeIcon
                icon={faStar}
                size="sm"
                className="size-3.5 text-amber-500"
              />
              Top 10 all-time
            </h3>
            <ol className="list-decimal space-y-3 ps-5 font-sans text-sm">
              {topTenBurgers.map((burger) => (
                <li key={burger.id} className="text-stone-800">
                  <Link
                    href={getBurgerPath(burger)}
                    className="block hover:text-brand-700"
                  >
                    <span className="font-venue">{burger.venue}</span>
                    <span className="mt-0.5 line-clamp-1 block text-stone-500">
                      {burger.address}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          {collectionStats ? <HomeBurgerStats stats={collectionStats} /> : null}
        </aside>
      </>
    );
  } else {
    content = (
      <div className="mx-auto max-w-md text-center">
        <SiteWordmark className="mx-auto my-5 text-4xl text-stone-900" />
        <EmptyState message="Rate some burgers!" title="No burgers yet" />
      </div>
    );
  }

  return (
    <Layout>
      <PageMeta
        title={
          currentPage > 1 ? `BurgerTime — Page ${currentPage}` : 'BurgerTime'
        }
        canonicalPath="/"
        noIndex={currentPage > 1}
        pagination={!loading ? listPagination : undefined}
      />
      <div id="home-hero">
        <header className="pt-4 pb-2 text-center md:pt-6">
          <div className="mb-1 flex justify-center">
            <SiteWordmark
              as="h1"
              className="text-3xl text-stone-900 md:text-4xl"
              priority
            />
          </div>
          <p className="mx-auto mb-3 max-w-2xl text-sm text-stone-600 md:text-base">
            One man&apos;s journey to eat every cheeseburger in the world.{' '}
            <em className="text-stone-500">(Mostly NYC.)</em>
          </p>
        </header>
        <Divider compact />
      </div>
      <main className="min-w-0 pb-12 lg:flex lg:gap-8">{content}</main>
    </Layout>
  );
};

export default Home;
