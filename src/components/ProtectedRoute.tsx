import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spin } from 'antd';
import { useAuth } from 'context/AuthContext';
import { ADMINUID } from 'functions';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed =
    Boolean(user) && (!requireAdmin || user?.uid === ADMINUID);

  useEffect(() => {
    if (!loading && !allowed) {
      void router.replace('/');
    }
  }, [allowed, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" description="Checking sign-in…" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin description="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
