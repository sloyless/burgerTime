import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User, UserCredential } from 'firebase/auth';

const AUTH_INIT_TIMEOUT_MS = 12_000;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: () => Promise<UserCredential | void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Avoid importing `utils/firebase` at module scope — that loads the client SDK
 * during SSR and breaks firebase-admin on Firebase Hosting dynamic routes.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let settled = false;
    let unsubscribe: (() => void) | undefined;

    const finishLoading = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(finishLoading, AUTH_INIT_TIMEOUT_MS);

    void (async () => {
      const [{ auth }, { getRedirectResult, onAuthStateChanged }, { consumeAuthRedirectPending }] =
        await Promise.all([
          import('utils/firebase'),
          import('firebase/auth'),
          import('utils/authRedirectPending'),
        ]);

      if (consumeAuthRedirectPending()) {
        try {
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult?.user) {
            setUser(redirectResult.user);
          }
        } catch (error) {
          console.error('Firebase redirect sign-in failed:', error);
        }
      }

      unsubscribe = onAuthStateChanged(
        auth,
        (userImp) => {
          setUser(userImp);
          finishLoading();
        },
        (error) => {
          console.error('Firebase auth state error:', error);
          finishLoading();
        }
      );
    })();

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, []);

  const login = useCallback(async () => {
    const { signInWithGoogle } = await import('utils/googleSignIn');
    return signInWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    const [{ auth }, { signOut }] = await Promise.all([
      import('utils/firebase'),
      import('firebase/auth'),
    ]);
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({ loading, user, login, logout }),
    [loading, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
