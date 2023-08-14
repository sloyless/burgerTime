import { ReactNode } from 'react';
import NavBar from 'components/NavBar';
import { useAuth } from 'context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  return (
    <>
      <NavBar user={user} />
      <div>{children}</div>
    </>
  );
};
