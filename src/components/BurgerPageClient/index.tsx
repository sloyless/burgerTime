import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { doc, DocumentData, onSnapshot, updateDoc } from 'firebase/firestore';
import PageMeta from 'components/PageMeta';
import { useRouter } from 'next/router';
import { Result } from 'antd';

import { Layout } from 'layout';
import { resolveBurgerDocumentId } from 'libs/burgerQueries';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
import { allocateBurgerSlug, getCanonicalBurgerSlug } from 'utils/burgerSlug';
import {
  ADMINUID,
  calculateTimestamp,
  getDisplayScore,
  timestampToDateInputValue,
} from 'functions';
import { getBurgerPath } from 'utils/burgerSlug';
import { BURGER_WITH_RULES_MAIN_CLASSNAME } from 'theme/layout';
import BurgerRules from 'components/BurgerRules';
import BurgerEditForm from 'components/BurgerEditForm';
import BurgerDetailView from 'components/BurgerDetailView';
import Button from 'components/Button';
import { useAuth } from 'context/AuthContext';
import PageLoading from 'components/PageLoading';

type Props = {
  slug: string;
};

function BurgerPageClient({ slug: slugFromServer }: Readonly<Props>) {
  const router = useRouter();
  const urlSegment =
    (typeof router.query.slug === 'string' ? router.query.slug : undefined) ??
    slugFromServer;
  const { user } = useAuth();

  const [documentId, setDocumentId] = useState<string>();
  const [resolving, setResolving] = useState(true);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [burger, setBurger] = useState<DocumentData>();
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);
  const [listenKey, setListenKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editBaseline, setEditBaseline] = useState<DocumentData | null>(null);
  const documentIdRef = useRef<string | undefined>(undefined);
  const slugBackfillAttemptedRef = useRef<Set<string>>(new Set());

  const isAdmin = user?.uid === ADMINUID;

  useEffect(() => {
    if (!urlSegment) return;

    let cancelled = false;
    setResolving(true);
    setResolveFailed(false);

    void resolveBurgerDocumentId(urlSegment)
      .then((resolvedId) => {
        if (cancelled) return;

        if (!resolvedId) {
          setDocumentId(undefined);
          documentIdRef.current = undefined;
          setBurger(undefined);
          setResolving(false);
          return;
        }

        if (resolvedId === documentIdRef.current) {
          setResolving(false);
          return;
        }

        documentIdRef.current = resolvedId;
        setDocumentId(resolvedId);
        setResolving(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to resolve burger URL:', error);
        setDocumentId(undefined);
        documentIdRef.current = undefined;
        setBurger(undefined);
        setResolveFailed(true);
        setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlSegment]);

  useEffect(() => {
    if (!documentId) {
      setSnapshotLoaded(false);
      setSnapshotError(false);
      return;
    }

    setSnapshotLoaded(false);
    setSnapshotError(false);

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setSnapshotError(true);
      setSnapshotLoaded(true);
      console.warn('Burger snapshot timed out');
    }, 12_000);

    const unsub = onSnapshot(
      doc(database, 'burgers', documentId),
      (docSnap) => {
        if (timedOut) return;
        window.clearTimeout(timeoutId);
        setSnapshotLoaded(true);
        setSnapshotError(false);
        if (docSnap.exists()) {
          setBurger({ ...docSnap.data(), id: docSnap.id });
        } else {
          setBurger(undefined);
        }
      },
      (error) => {
        window.clearTimeout(timeoutId);
        setSnapshotLoaded(true);
        setSnapshotError(true);
        console.error('Failed to load burger:', error);
        setBurger(undefined);
      }
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsub();
    };
  }, [documentId, listenKey]);

  const burgerRecord = burger as Burger | undefined;
  const canonicalSlug = burgerRecord
    ? burgerRecord.slug ?? getCanonicalBurgerSlug(burgerRecord)
    : undefined;

  useEffect(() => {
    if (
      !isAdmin ||
      resolving ||
      !burgerRecord ||
      !documentId ||
      burgerRecord.slug ||
      slugBackfillAttemptedRef.current.has(documentId)
    ) {
      return;
    }

    const reviewDateYmd = timestampToDateInputValue(
      burgerRecord.timestamp as { seconds?: number }
    );
    if (!reviewDateYmd) return;

    slugBackfillAttemptedRef.current.add(documentId);

    void allocateBurgerSlug(
      burgerRecord.venue,
      burgerRecord.burgerName,
      reviewDateYmd,
      documentId
    )
      .then((slug) => updateDoc(doc(database, 'burgers', documentId), { slug }))
      .catch((error) => {
        console.error('Failed to backfill burger slug:', error);
        slugBackfillAttemptedRef.current.delete(documentId);
      });
  }, [isAdmin, resolving, burgerRecord, documentId]);

  useEffect(() => {
    if (resolving || !canonicalSlug || !urlSegment) return;
    if (urlSegment !== canonicalSlug) {
      void router.replace(`/burger/${canonicalSlug}`, undefined, {
        shallow: true,
      });
    }
  }, [resolving, canonicalSlug, urlSegment, router]);

  function openEdit() {
    if (!burgerRecord || !isAdmin) return;
    setEditBaseline({ ...burgerRecord });
    setIsEditing(true);
  }

  function closeEdit() {
    setIsEditing(false);
    setEditBaseline(null);
  }

  function handleEditSaved(slug: string) {
    setIsEditing(false);
    setEditBaseline(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (slug && urlSegment !== slug) {
      void router.replace(`/burger/${slug}`, undefined, { shallow: true });
    }
  }

  function retrySnapshot() {
    setSnapshotError(false);
    setSnapshotLoaded(false);
    setListenKey((key) => key + 1);
  }

  const loading = resolving || (Boolean(documentId) && !snapshotLoaded);
  const notFound =
    !loading &&
    !resolveFailed &&
    !snapshotError &&
    !burgerRecord &&
    (!documentId || snapshotLoaded);

  if (loading) {
    return (
      <Layout padding={false}>
        <PageMeta
          title="Burger review"
          canonicalPath={`/burger/${urlSegment}`}
        />
        <PageLoading tip="Loading review…" />
      </Layout>
    );
  }

  if (resolveFailed || snapshotError) {
    return (
      <Layout padding={false}>
        <PageMeta title="Could not load review" noIndex />
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <Result
            status="warning"
            title="Could not load this review"
            subTitle="Check your connection and try again."
            extra={
              <Button type="button" status="primary" onClick={retrySnapshot}>
                Try again
              </Button>
            }
          />
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout padding={false}>
        <PageMeta
          title="Review not found"
          description="This burger review could not be found."
          noIndex
          canonicalPath={`/burger/${urlSegment}`}
        />
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <Result
            status="404"
            title="Review not found"
            subTitle="It may have been removed or the link is outdated."
            extra={
              <Link
                href="/"
                className="font-medium text-brand-700 hover:text-brand-800"
              >
                Back to home
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const score = burgerRecord ? getDisplayScore(burgerRecord) : 0;
  const pageTitle = burgerRecord
    ? `${burgerRecord.venue ?? 'Review'} — ${burgerRecord.burgerName ?? 'Burger'}`
    : 'Review not found';
  const metaDescription = burgerRecord?.notes
    ? String(burgerRecord.notes).slice(0, 160)
    : burgerRecord
      ? `Burger review at ${burgerRecord.venue ?? 'unknown venue'}. Score: ${score}.`
      : 'This burger review could not be found.';
  const metaImage =
    burgerRecord?.image && typeof burgerRecord.image === 'string'
      ? burgerRecord.image
      : undefined;
  const reviewTimestamp = burgerRecord?.timestamp
    ? calculateTimestamp(
        (burgerRecord.timestamp as { seconds?: number }).seconds ?? 0
      )
    : undefined;
  const publishedTime =
    reviewTimestamp && !Number.isNaN(reviewTimestamp.getTime())
      ? reviewTimestamp.toISOString()
      : undefined;
  const canonicalPath =
    burgerRecord && canonicalSlug
      ? getBurgerPath({ ...burgerRecord, slug: canonicalSlug })
      : `/burger/${urlSegment}`;
  const jsonLd = burgerRecord
    ? {
        '@context': 'https://schema.org',
        '@type': 'Review',
        name: burgerRecord.burgerName ?? 'Burger review',
        reviewBody: burgerRecord.notes
          ? String(burgerRecord.notes).slice(0, 5000)
          : metaDescription,
        datePublished: publishedTime,
        itemReviewed: {
          '@type': 'FoodEstablishment',
          name: burgerRecord.venue ?? 'Restaurant',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: score,
          bestRating: 100,
          worstRating: 0,
        },
        ...(metaImage ? { image: metaImage } : {}),
      }
    : undefined;

  return (
    <Layout padding={false}>
      <PageMeta
        title={pageTitle}
        description={metaDescription}
        image={metaImage}
        imageAlt={
          burgerRecord
            ? `${burgerRecord.burgerName ?? 'Burger'} at ${burgerRecord.venue ?? 'venue'} — score ${score}`
            : undefined
        }
        type="article"
        publishedTime={publishedTime}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />
      <main className={BURGER_WITH_RULES_MAIN_CLASSNAME}>
        <div className="max-w-full min-w-0 flex-1">
          {burgerRecord && documentId ? (
            <>
              {isAdmin && !isEditing && (
                <div className="mb-4 text-end">
                  <Button type="button" status="primary" onClick={openEdit}>
                    Edit
                  </Button>
                </div>
              )}
              {isEditing && editBaseline ? (
                <BurgerEditForm
                  key={documentId}
                  burgerId={documentId}
                  initial={editBaseline}
                  onCancel={closeEdit}
                  onSaved={handleEditSaved}
                />
              ) : (
                <BurgerDetailView burger={burgerRecord} score={score} />
              )}
            </>
          ) : null}
        </div>
        <BurgerRules />
      </main>
    </Layout>
  );
}

export default BurgerPageClient;
