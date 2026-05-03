import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "../firebase";
import { subscribeSubmissions } from "../services/submissionsService";
import type { ProductSubmission } from "../types/submission";
import { friendlyErrorMessage } from "../utils/friendlyErrors";

export function useSubmissions(enabled: boolean) {
  const [submissions, setSubmissions] = useState<ProductSubmission[]>([]);
  const [loading, setLoading] = useState(enabled && isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeSubmissions(
      (items) => {
        setSubmissions(items);
        setLoading(false);
      },
      (err) => {
        setError(friendlyErrorMessage(err, "product"));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [enabled]);

  const pending = useMemo(
    () => submissions.filter((submission) => submission.status === "pending"),
    [submissions],
  );
  const reviewed = useMemo(
    () => submissions.filter((submission) => submission.status !== "pending"),
    [submissions],
  );

  return { submissions, pending, reviewed, loading, error };
}
