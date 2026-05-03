import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "../firebase";
import { subscribeInventory } from "../services/inventoryService";
import type { InventoryItem } from "../types/inventory";
import { getExpiryStatus } from "../utils/expiry";
import { friendlyErrorMessage } from "../utils/friendlyErrors";

export function useInventory(householdId: string | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeInventory(
      householdId,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      (err) => {
        setError(friendlyErrorMessage(err, "stock"));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [householdId]);

  const activeItems = useMemo(() => items.filter((item) => item.status === "active"), [items]);
  const summary = useMemo(() => {
    const counts = {
      expired: 0,
      today: 0,
      next3Days: 0,
      thisWeek: 0,
      safe: 0,
    };
    activeItems.forEach((item) => {
      const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);
      if (status === "expired") counts.expired += 1;
      else if (status === "today") counts.today += 1;
      else if (status === "tomorrow" || status === "soon_3_days") counts.next3Days += 1;
      else if (status === "this_week") counts.thisWeek += 1;
      else counts.safe += 1;
    });
    return counts;
  }, [activeItems]);

  return { items, activeItems, summary, loading, error };
}
