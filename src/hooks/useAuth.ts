import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setError("Firebase is not configured. Add .env values to enable live data.");
      return;
    }

    const currentAuth = auth;
    const unsubscribe = onAuthStateChanged(
      currentAuth,
      async (nextUser) => {
        try {
          if (!nextUser) {
            await signInAnonymously(currentAuth);
            return;
          }
          setUser(nextUser);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not sign in anonymously.");
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { user, loading, error, isFirebaseConfigured };
}
