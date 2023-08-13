import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  UserCredential,
  User,
} from '@firebase/auth';
import { auth } from 'utils/firebase';

const provider = new GoogleAuthProvider();

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  login: () => signInWithPopup(auth, provider),
  logout: () => Promise.resolve(),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userImp) => {
      if (userImp) {
        setUser(userImp);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = () => {
    return signInWithPopup(auth, provider);
  };

  const logout = async () => {
    setUser(null);

    return await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ loading, user, login, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useCount must be used within a CountProvider');
  }

  return context;
};
