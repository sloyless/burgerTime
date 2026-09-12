import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { doc, DocumentData, onSnapshot, updateDoc } from 'firebase/firestore';
import BurgerPageMeta from 'components/BurgerPageMeta';
import PageMeta from 'components/PageMeta';
import { useRouter } from 'next/router';
import { Result } from 'antd';

import { Layout } from 'layout';
import { useBurgerUrlSegment } from 'hooks/useBurgerUrlSegment';
import { resolveBurgerDocumentId } from 'libs/burgerQueries';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
import { allocateBurgerSlug, getCanonicalBurgerSlug } from 'utils/burgerSlug';
import {
  ADMINUID,
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

function BurgerPageClient() {
  const router = useRouter();
  const urlSegment = useBurgerUrlSegment();
  const { user } = useAuth();

  const [documentId, setDocumentId] = useState<string | undefined>();
  const [resolving, setResolving] = useState(true);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [burger, setBurger] = useState<DocumentData | undefined>();
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
    ? (burgerRecord.slug ?? getCanonicalBurgerSlug(burgerRecord))
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
    if (resolving || !burgerRecord || !urlSegment) return;
    const targetPath = getBurgerPath(burgerRecord);
    const targetSegment = targetPath.replace(/^\/burger\//, '');
    if (!targetSegment || urlSegment === targetSegment) return;
    void router.replace(targetPath);
  }, [resolving, burgerRecord, urlSegment, router]);

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
      void router.replace(`/burger/${slug}`);
    }
  }

  function retrySnapshot() {
    setSnapshotError(false);
    setSnapshotLoaded(false);
    setListenKey((key) => key + 1);
  }

  const waitingForUrl = !urlSegment;
  const loading =
    waitingForUrl || resolving || (Boolean(documentId) && !snapshotLoaded);
  const notFound =
    Boolean(urlSegment) &&
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
                className="text-brand-700 hover:text-brand-800 font-medium"
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

  return (
    <Layout padding={false}>
      {burgerRecord ? (
        <BurgerPageMeta
          burger={{ ...burgerRecord, id: documentId, slug: canonicalSlug }}
          urlSegment={urlSegment}
        />
      ) : null}
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
