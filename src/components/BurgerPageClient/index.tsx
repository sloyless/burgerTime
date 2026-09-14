import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  doc,
  type DocumentData,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import BurgerPageMeta from 'components/BurgerPageMeta';
import PageMeta from 'components/PageMeta';
import { useRouter } from 'next/router';
import { Result } from 'antd';

import { Layout } from 'layout';
import { useBurgerUrlSegment } from 'hooks/useBurgerUrlSegment';
import { resolveBurgerDocumentId } from 'libs/burgerQueries';
import { database } from 'utils/firebase';
import type { ServerBurger } from 'utils/serverBurger';
import type { Burger } from 'utils/types';
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
import BurgerDetailSkeleton from 'components/BurgerDetailSkeleton';

type UrlResolution = {
  segment: string;
  documentId: string | null;
  status: 'ok' | 'not_found' | 'error';
};

type BurgerSnapshot = {
  key: string;
  burger?: DocumentData;
  loaded: boolean;
  error: boolean;
};

type Props = {
  slug: string;
  initialBurger: ServerBurger | null;
};

function BurgerPageClient({
  slug: slugFromServer,
  initialBurger,
}: Readonly<Props>) {
  const router = useRouter();
  const urlSegmentFromPath = useBurgerUrlSegment();
  const slugFromRouter =
    typeof router.query.slug === 'string' && router.query.slug !== '[slug]'
      ? router.query.slug
      : '';
  const urlSegment = slugFromRouter || slugFromServer || urlSegmentFromPath;
  const { user } = useAuth();

  const seededBurger =
    initialBurger && slugFromServer === urlSegment ? initialBurger : null;

  const [resolution, setResolution] = useState<UrlResolution | null>(() =>
    seededBurger
      ? {
          segment: urlSegment,
          documentId: seededBurger.id,
          status: 'ok',
        }
      : null
  );
  const [snapshot, setSnapshot] = useState<BurgerSnapshot | null>(() =>
    seededBurger
      ? {
          key: `${seededBurger.id}:0`,
          loaded: true,
          error: false,
          burger: seededBurger,
        }
      : null
  );
  const [listenKey, setListenKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editBaseline, setEditBaseline] = useState<DocumentData | null>(null);
  const documentIdRef = useRef<string | undefined>(seededBurger?.id);
  const slugBackfillAttemptedRef = useRef<Set<string>>(new Set());

  const isAdmin = user?.uid === ADMINUID;

  const resolutionComplete =
    Boolean(urlSegment) && resolution?.segment === urlSegment;
  const resolving = Boolean(urlSegment) && !resolutionComplete;
  const resolveFailed = resolutionComplete && resolution?.status === 'error';
  const documentId =
    resolutionComplete && resolution?.status === 'ok' && resolution.documentId
      ? resolution.documentId
      : undefined;

  const snapshotKey = documentId ? `${documentId}:${listenKey}` : '';
  const snapshotLoaded =
    Boolean(documentId) && snapshot?.key === snapshotKey && snapshot.loaded;
  const snapshotError =
    Boolean(documentId) && snapshot?.key === snapshotKey && snapshot.error;
  const burger = snapshot?.key === snapshotKey ? snapshot.burger : undefined;

  useEffect(() => {
    if (!urlSegment) return;

    if (seededBurger?.id && slugFromServer === urlSegment) {
      documentIdRef.current = seededBurger.id;
      return;
    }

    let cancelled = false;

    void resolveBurgerDocumentId(urlSegment)
      .then((resolvedId) => {
        if (cancelled) return;

        if (!resolvedId) {
          documentIdRef.current = undefined;
          setResolution({
            segment: urlSegment,
            documentId: null,
            status: 'not_found',
          });
          return;
        }

        documentIdRef.current = resolvedId;
        setResolution({
          segment: urlSegment,
          documentId: resolvedId,
          status: 'ok',
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to resolve burger URL:', error);
        documentIdRef.current = undefined;
        setResolution({
          segment: urlSegment,
          documentId: null,
          status: 'error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [urlSegment, seededBurger, slugFromServer]);

  useEffect(() => {
    if (!documentId) return;

    const key = `${documentId}:${listenKey}`;

    if (!isAdmin) {
      if (snapshot?.key === key && snapshot.loaded) {
        return;
      }

      let cancelled = false;
      void getDoc(doc(database, 'burgers', documentId))
        .then((docSnap) => {
          if (cancelled) return;
          if (docSnap.exists()) {
            setSnapshot({
              key,
              loaded: true,
              error: false,
              burger: { ...docSnap.data(), id: docSnap.id },
            });
          } else {
            setSnapshot({
              key,
              loaded: true,
              error: false,
              burger: undefined,
            });
          }
        })
        .catch((error) => {
          if (cancelled) return;
          console.error('Failed to load burger:', error);
          setSnapshot({
            key,
            loaded: true,
            error: true,
            burger: undefined,
          });
        });

      return () => {
        cancelled = true;
      };
    }

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setSnapshot({ key, loaded: true, error: true, burger: undefined });
      console.warn('Burger snapshot timed out');
    }, 12_000);

    const unsub = onSnapshot(
      doc(database, 'burgers', documentId),
      (docSnap) => {
        if (timedOut) return;
        window.clearTimeout(timeoutId);
        if (docSnap.exists()) {
          setSnapshot({
            key,
            loaded: true,
            error: false,
            burger: { ...docSnap.data(), id: docSnap.id },
          });
        } else {
          setSnapshot({
            key,
            loaded: true,
            error: false,
            burger: undefined,
          });
        }
      },
      (error) => {
        window.clearTimeout(timeoutId);
        console.error('Failed to load burger:', error);
        setSnapshot({
          key,
          loaded: true,
          error: true,
          burger: undefined,
        });
      }
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsub();
    };
  }, [documentId, isAdmin, listenKey, snapshot?.key, snapshot?.loaded]);

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

  const serverRenderedMeta = Boolean(
    initialBurger && slugFromServer === urlSegment
  );

  if (loading) {
    return (
      <Layout padding={false}>
        {!serverRenderedMeta ? (
          <PageMeta
            title="Burger review"
            canonicalPath={`/burger/${urlSegment}`}
          />
        ) : null}
        <BurgerDetailSkeleton />
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

  return (
    <Layout padding={false}>
      {burgerRecord && (!serverRenderedMeta || snapshotLoaded) ? (
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
