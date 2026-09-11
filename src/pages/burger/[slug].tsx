import { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import { doc, DocumentData, onSnapshot, updateDoc } from 'firebase/firestore';
import PageMeta from 'components/PageMeta';
import { useRouter } from 'next/router';

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

const BurgerPage: NextPage = () => {
  const router = useRouter();
  const urlSegment =
    typeof router.query.slug === 'string' ? router.query.slug : undefined;
  const { user } = useAuth();

  const [documentId, setDocumentId] = useState<string>();
  const [resolving, setResolving] = useState(true);
  const [burger, setBurger] = useState<DocumentData>();
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBaseline, setEditBaseline] = useState<DocumentData | null>(null);
  const documentIdRef = useRef<string | undefined>(undefined);

  const isAdmin = user?.uid === ADMINUID;

  useEffect(() => {
    if (!urlSegment) return;

    let cancelled = false;
    setResolving(true);

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
        setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlSegment]);

  useEffect(() => {
    if (!documentId) {
      setSnapshotLoaded(false);
      return;
    }

    setSnapshotLoaded(false);
    const timeoutId = window.setTimeout(() => {
      setSnapshotLoaded(true);
      console.warn('Burger snapshot timed out');
    }, 10000);

    const unsub = onSnapshot(
      doc(database, 'burgers', documentId),
      (docSnap) => {
        window.clearTimeout(timeoutId);
        setSnapshotLoaded(true);
        if (docSnap.exists()) {
          setBurger({ ...docSnap.data(), id: docSnap.id });
        } else {
          setBurger(undefined);
        }
      },
      (error) => {
        window.clearTimeout(timeoutId);
        setSnapshotLoaded(true);
        console.error('Failed to load burger:', error);
        setBurger(undefined);
      }
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsub();
    };
  }, [documentId]);

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
      burgerRecord.slug
    ) {
      return;
    }

    const reviewDateYmd = timestampToDateInputValue(
      burgerRecord.timestamp as { seconds?: number }
    );
    if (!reviewDateYmd) return;

    void allocateBurgerSlug(
      burgerRecord.venue,
      burgerRecord.burgerName,
      reviewDateYmd,
      documentId
    ).then((slug) => updateDoc(doc(database, 'burgers', documentId), { slug }));
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
    if (!burgerRecord) return;
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

  const loading =
    resolving || (Boolean(documentId) && !snapshotLoaded);

  if (loading) {
    return (
      <Layout padding={false}>
        <PageMeta title="Burger review" />
        <PageLoading tip="Loading review…" />
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
      : undefined;
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
                  <Button
                    type="button"
                    status="primary"
                    onClick={openEdit}
                  >
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
};

export default BurgerPage;
