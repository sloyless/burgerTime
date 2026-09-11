import Head from 'next/head';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { App, ConfigProvider } from 'antd';
import 'styles/globals.css';
import { AuthProvider } from 'context/AuthContext';
import ErrorBoundary from 'components/ErrorBoundary';
import ProtectedRoute from 'components/ProtectedRoute';
import { antdTheme } from 'theme/antd';

const protectedRoutes = ['/add'];

function BurgerApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <AuthProvider>
          <Head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <link rel="icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/logo.png" />
            <meta name="theme-color" content="#1c1917" />
          </Head>
          <ErrorBoundary>
            {protectedRoutes.includes(router.pathname) ? (
              <ProtectedRoute requireAdmin>
                <Component {...pageProps} />
              </ProtectedRoute>
            ) : (
              <Component {...pageProps} />
            )}
          </ErrorBoundary>
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}

export default BurgerApp;
