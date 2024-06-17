import { ReactNode } from 'react';
import NavBar from 'components/NavBar';
import Divider from 'components/Divider';
import { GoogleAnalytics } from '@next/third-parties/google';

interface LayoutProps {
  children: ReactNode;
  padding?: boolean;
}

export const Layout = ({ children, padding = true }: LayoutProps) => {
  return (
    <>
      <NavBar />
      <div
        className={`font-serif container mx-auto ${padding ? 'px-3' : 'px-0'}`}
      >
        {children}
      </div>
      <div className="container mx-auto my-5 px-3">
        <Divider />
        <div className="font-serif text-center">
          All photos, content, and development &copy;{' '}
          {new Date().toLocaleDateString('en-US', { year: 'numeric' })} Sean
          Loyless
        </div>
      </div>
      <GoogleAnalytics gaId="G-4H0QMV5XVK" />
    </>
  );
};
