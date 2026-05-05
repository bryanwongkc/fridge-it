import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/auth";
import { firebaseConfigMissing } from "../firebase/firebase";
import { ensureUserDocument, subscribeUserDocument } from "../services/householdService";
import type { AppUser } from "../types/user";

interface AuthContextValue {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseConfigMissing) {
      setUser(null);
      setAppUser(null);
      setLoading(false);
      return () => undefined;
    }

    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      unsubscribeUserDoc?.();
      setError(null);
      setUser(nextUser);

      if (!nextUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await ensureUserDocument({
          uid: nextUser.uid,
          displayName: nextUser.displayName,
          email: nextUser.email,
        });
        unsubscribeUserDoc = subscribeUserDocument(nextUser.uid, (nextAppUser) => {
          setAppUser(nextAppUser);
          setLoading(false);
        });
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Auth failed.");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeUserDoc?.();
      unsubscribeAuth();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (firebaseConfigMissing) {
      throw new Error("Add Firebase values in .env.local before signing in.");
    }
    setError(null);
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (firebaseConfigMissing) {
      throw new Error("Add Firebase values in .env.local before signing in.");
    }
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const createAccountWithEmail = useCallback(async (email: string, password: string) => {
    if (firebaseConfigMissing) {
      throw new Error("Add Firebase values in .env.local before signing in.");
    }
    setError(null);
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signOutUser = useCallback(async () => {
    setError(null);
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      appUser,
      loading,
      error,
      signInWithGoogle,
      signInWithEmail,
      createAccountWithEmail,
      signOutUser,
    }),
    [
      user,
      appUser,
      loading,
      error,
      signInWithGoogle,
      signInWithEmail,
      createAccountWithEmail,
      signOutUser,
    ],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
