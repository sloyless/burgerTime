import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { User } from '@firebase/auth';
const inter = Inter({ subsets: ['latin'] });

interface LayoutProps {
  children: ReactNode;
  user?: User | null;
}

export const Layout = ({ children, user }: LayoutProps) => {
  console.log(user);
  return (
    <>
      <div>Hello {user?.displayName}</div>
      <div>{children}</div>
    </>
  );
};
