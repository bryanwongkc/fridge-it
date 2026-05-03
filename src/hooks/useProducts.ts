import { useEffect, useMemo, useState } from "react";
import type { HouseholdProduct, PublicProduct } from "../types/product";
import { subscribeHouseholdProducts, subscribePublicProducts } from "../services/productsService";
import { isFirebaseConfigured } from "../firebase";
import { friendlyErrorMessage } from "../utils/friendlyErrors";

export function useProducts(householdId: string | null) {
  const [personalProducts, setPersonalProducts] = useState<HouseholdProduct[]>([]);
  const [publicProducts, setPublicProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubPersonal = subscribeHouseholdProducts(
      householdId,
      (items) => {
        setPersonalProducts(items);
        setLoading(false);
      },
      (err) => {
        setError(friendlyErrorMessage(err, "product"));
        setLoading(false);
      },
    );
    const unsubPublic = subscribePublicProducts(
      setPublicProducts,
      (err) => setError(friendlyErrorMessage(err, "product")),
    );

    return () => {
      unsubPersonal();
      unsubPublic();
    };
  }, [householdId]);

  const recentProducts = useMemo(
    () =>
      [...personalProducts]
        .sort((a, b) => {
          const aLastUsed = a.lastUsedAt?.toMillis?.() ?? 0;
          const bLastUsed = b.lastUsedAt?.toMillis?.() ?? 0;
          const lastUsedDiff = bLastUsed - aLastUsed;
          return lastUsedDiff || b.useCount - a.useCount;
        })
        .slice(0, 12),
    [personalProducts],
  );

  return { personalProducts, publicProducts, recentProducts, loading, error };
}
