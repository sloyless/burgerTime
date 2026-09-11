import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [burger, setBurger] = useState<DocumentData>();
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.uid === ADMINUID;

  useEffect(() => {
    setIsEditing(false);
  }, [urlSegment]);

  function handleEditSaved(slug: string) {
    setIsEditing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (slug && urlSegment !== slug) {
      void router.replace(`/burger/${slug}`, undefined, { shallow: false });
    }
  }

  useEffect(() => {
    if (!urlSegment) return;

    let unsub: (() => void) | undefined;
    let cancelled = false;

    setLoading(true);
    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 10000);

    void resolveBurgerDocumentId(urlSegment)
      .then((resolvedId) => {
        if (cancelled) return;

        if (!resolvedId) {
          setDocumentId(undefined);
          setBurger(undefined);
          setLoading(false);
          window.clearTimeout(timeoutId);
          return;
        }

        setDocumentId(resolvedId);

        unsub = onSnapshot(
          doc(database, 'burgers', resolvedId),
          (docSnap) => {
            window.clearTimeout(timeoutId);
            if (docSnap.exists()) {
              setBurger({ ...docSnap.data(), id: docSnap.id });
            } else {
              setBurger(undefined);
            }
            setLoading(false);
          },
          (error) => {
            window.clearTimeout(timeoutId);
            console.error('Failed to load burger:', error);
            setBurger(undefined);
            setLoading(false);
          }
        );
      })
      .catch((error) => {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        console.error('Failed to resolve burger URL:', error);
        setDocumentId(undefined);
        setBurger(undefined);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsub?.();
    };
  }, [urlSegment]);

  const burgerRecord = burger as Burger | undefined;
  const canonicalSlug =
    burgerRecord?.slug ??
    (burgerRecord ? getCanonicalBurgerSlug(burgerRecord) : undefined);

  useEffect(() => {
    if (
      !isAdmin ||
      loading ||
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
  }, [isAdmin, loading, burgerRecord, documentId]);

  useEffect(() => {
    if (loading || !canonicalSlug || !urlSegment || !burgerRecord) return;
    if (urlSegment !== canonicalSlug) {
      void router.replace(`/burger/${canonicalSlug}`, undefined, {
        shallow: false,
      });
    }
  }, [loading, canonicalSlug, urlSegment, burgerRecord, router]);

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
  const publishedTime = reviewTimestamp?.toISOString();
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
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
              {isEditing ? (
                <BurgerEditForm
                  burgerId={documentId}
                  initial={burgerRecord}
                  onCancel={() => setIsEditing(false)}
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
