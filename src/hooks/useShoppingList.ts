import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "../firebase";
import { subscribeShoppingList } from "../services/shoppingService";
import type { ShoppingItem } from "../types/shopping";

export function useShoppingList(householdId: string | null) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeShoppingList(
      householdId,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [householdId]);

  const active = useMemo(() => items.filter((item) => !item.checked), [items]);
  const checked = useMemo(() => items.filter((item) => item.checked), [items]);
  return { items, active, checked, loading, error };
}
