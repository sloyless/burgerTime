import { useCallback, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Input, Result } from 'antd';

import Button from 'components/Button';
import Card from 'components/Card';
import PageMeta from 'components/PageMeta';
import SectionHeading from 'components/SectionHeading';
import Bone from 'components/Skeleton/Bone';
import { searchBurgers } from 'libs/burgerQueries';
import { Layout } from 'layout';
import type { Burger } from 'utils/types';
import { getBurgerPath } from 'utils/burgerSlug';

const { Search } = Input;

type SearchFetchState = {
  term: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  results: Burger[];
};

const idleFetch: SearchFetchState = {
  term: '',
  status: 'idle',
  results: [],
};

const SearchPage: NextPage = () => {
  const router = useRouter();
  const urlQ =
    router.isReady && typeof router.query.q === 'string' ? router.query.q : '';
  const submittedQuery = urlQ.trim();

  const [draftQuery, setDraftQuery] = useState('');
  const [lastSyncedUrlQ, setLastSyncedUrlQ] = useState<string | null>(null);
  if (router.isReady && lastSyncedUrlQ !== urlQ) {
    setLastSyncedUrlQ(urlQ);
    setDraftQuery(urlQ);
  }

  const [fetch, setFetch] = useState<SearchFetchState>(idleFetch);

  if (router.isReady) {
    if (!submittedQuery) {
      if (fetch.status !== 'idle' || fetch.term !== '') {
        setFetch(idleFetch);
      }
    } else if (
      submittedQuery !== fetch.term ||
      (fetch.term === submittedQuery && fetch.status === 'idle')
    ) {
      setFetch({
        term: submittedQuery,
        status: 'loading',
        results: [],
      });
    }
  }

  useEffect(() => {
    if (fetch.status !== 'loading') return;

    const term = fetch.term;
    let cancelled = false;

    void searchBurgers(term)
      .then((items) => {
        if (!cancelled) {
          setFetch({ term, status: 'done', results: items });
        }
      })
      .catch((error) => {
        console.error('Search failed:', error);
        if (!cancelled) {
          setFetch({ term, status: 'error', results: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetch.status, fetch.term]);

  const loading = fetch.status === 'loading';
  const loadError = fetch.status === 'error';
  const results = fetch.status === 'done' ? fetch.results : [];

  const retrySearch = useCallback(() => {
    if (!submittedQuery) return;
    setFetch({ term: submittedQuery, status: 'loading', results: [] });
  }, [submittedQuery]);

  const runSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setDraftQuery(value);
      if (!trimmed) {
        void router.push('/search', undefined, { shallow: true });
        return;
      }
      void router.push(
        { pathname: '/search', query: { q: trimmed } },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  let resultsContent;
  if (!submittedQuery) {
    resultsContent = (
      <p className="text-center text-stone-600">
        Search by venue, burger name, neighborhood, notes, or cook type.
      </p>
    );
  } else if (loading) {
    resultsContent = (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true">
        <span className="sr-only">Searching reviews</span>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            <Bone className="aspect-5/3 w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Bone className="h-5 w-2/3" />
              <Bone className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (loadError) {
    resultsContent = (
      <div className="flex justify-center py-8">
        <Result
          status="error"
          title="Search failed"
          subTitle="Check your connection and try again."
          extra={
            <Button type="button" status="primary" onClick={retrySearch}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (results.length === 0) {
    resultsContent = (
      <p className="text-center text-stone-600">
        No reviews match &ldquo;{submittedQuery}&rdquo;.
      </p>
    );
  } else {
    resultsContent = (
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="text-center font-sans text-sm text-stone-600">
          {results.length} review{results.length === 1 ? '' : 's'} found
        </p>
        <div className="flex flex-col gap-6">
          {results.map((burger) => (
            <Card key={burger.id} burger={burger} url={getBurgerPath(burger)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <PageMeta
        title="Search reviews"
        description="Search BurgerTime reviews by venue, burger, location, and more."
        canonicalPath="/search"
        noIndex
      />
      <main className="py-8 pb-12">
        <SectionHeading subtitle="Find a review by venue, burger, or neighborhood.">
          Search
        </SectionHeading>
        <div className="mx-auto mb-10 max-w-xl">
          <Search
            size="large"
            placeholder="e.g. Shake Shack, double smash, Astor Place"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            onSearch={runSearch}
            enterButton="Search"
            allowClear
            loading={loading && Boolean(submittedQuery)}
          />
        </div>
        {resultsContent}
      </main>
    </Layout>
  );
};

export default SearchPage;
