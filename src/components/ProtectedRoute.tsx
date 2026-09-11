import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spin } from 'antd';
import { useAuth } from 'context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" description="Checking sign-in…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin description="Redirecting…" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
