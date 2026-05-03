import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "../firebase";
import { friendlyErrorMessage } from "../utils/friendlyErrors";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setError(friendlyErrorMessage(new Error("not configured"), "auth"));
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
          setError(friendlyErrorMessage(err, "auth"));
          setLoading(false);
        }
      },
      (err) => {
        setError(friendlyErrorMessage(err, "auth"));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { user, loading, error, isFirebaseConfigured };
}
