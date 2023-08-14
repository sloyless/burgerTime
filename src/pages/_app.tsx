import Head from 'next/head';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import 'styles/globals.css';
import { AuthProvider } from 'context/AuthContext';
import ProtectedRoute from 'components/ProtectedRoute';

const protectedRoutes = ['/dashboard', '/add'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AuthProvider>
      <Head>
        <meta charSet="utf-8" />
        <title>BurgerTime</title>
        <meta
          name="description"
          content="Rate and review your favorite burgers"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
        <meta property="og:type" content="website" />
      </Head>
      {protectedRoutes.includes(router.pathname) ? (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthProvider>
  );
}

export default MyApp;
