import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth } from 'utils/firebase';
import { signInWithGoogle } from 'utils/googleSignIn';

const AUTH_INIT_TIMEOUT_MS = 12_000;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: () => Promise<UserCredential | void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          setUser(redirectResult.user);
        }
      } catch (error) {
        console.error('Firebase redirect sign-in failed:', error);
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

  const login = useCallback(() => signInWithGoogle(), []);

  const logout = useCallback(async () => {
    setUser(null);
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
