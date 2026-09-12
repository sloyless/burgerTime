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
import { Burger } from 'utils/types';
import { getBurgerPath } from 'utils/burgerSlug';

const { Search } = Input;

const SearchPage: NextPage = () => {
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<Burger[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    setDraftQuery(q);
    setSubmittedQuery(q.trim());
  }, [router.isReady, router.query.q]);

  useEffect(() => {
    if (!router.isReady) return;

    const term = submittedQuery;
    if (!term) {
      setResults([]);
      setLoadError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    void (async () => {
      try {
        const items = await searchBurgers(term);
        if (!cancelled) {
          setResults(items);
        }
      } catch (error) {
        console.error('Search failed:', error);
        if (!cancelled) {
          setLoadError(true);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, submittedQuery]);

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
            <Button
              type="button"
              status="primary"
              onClick={() => runSearch(submittedQuery)}
            >
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
