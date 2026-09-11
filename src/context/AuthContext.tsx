import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  browserPopupRedirectResolver,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from 'utils/firebase';

const provider = new GoogleAuthProvider();

const AUTH_INIT_TIMEOUT_MS = 5000;

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  login: () => signInWithPopup(auth, provider, browserPopupRedirectResolver),
  logout: () => Promise.resolve(),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let settled = false;

    const finishLoading = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(finishLoading, AUTH_INIT_TIMEOUT_MS);

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Firebase redirect sign-in failed:', error);
      });

    const unsubscribe = onAuthStateChanged(
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

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const login = useCallback(() => {
    return signInWithPopup(auth, provider, browserPopupRedirectResolver);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({ loading, user, login, logout }),
    [loading, user, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
