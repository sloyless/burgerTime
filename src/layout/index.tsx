import type { ReactNode } from 'react';
import NavBar from 'components/NavBar';
import Divider from 'components/Divider';
import { GoogleAnalytics } from '@next/third-parties/google';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

interface LayoutProps {
  children: ReactNode;
  padding?: boolean;
}

export const Layout = ({ children, padding = true }: LayoutProps) => {
  return (
    <>
      <NavBar />
      <div
        className={`mx-auto w-full max-w-screen-2xl ${padding ? 'px-4 sm:px-6 lg:px-8' : 'px-0'}`}
      >
        {children}
      </div>
      <footer className="mx-auto mt-12 w-full max-w-screen-2xl px-4 pb-10 sm:px-6 lg:px-8">
        <Divider />
        <p className="text-center text-sm text-stone-500">
          All photos, content, and development &copy;{' '}
          {new Date().toLocaleDateString('en-US', { year: 'numeric' })} Sean
          Loyless
        </p>
      </footer>
      <GoogleAnalytics gaId="G-4H0QMV5XVK" />
    </>
  );
};
