import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addBuySoonItemsToGroceryList,
  addManualGroceryItem,
  deleteGroceryItem,
  setGroceryItemChecked,
  subscribeGroceryList,
} from "../services/groceryService";
import type { BuySoonItem } from "../services/buySoonService";
import type { AddGroceryItemInput, GroceryListItem } from "../types/grocery";
import { useActiveHousehold } from "./useActiveHousehold";
import { useAuth } from "./useAuth";

export function useGroceryList() {
  const { user } = useAuth();
  const { activeHouseholdId } = useActiveHousehold();
  const [items, setItems] = useState<GroceryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeHouseholdId) {
      setItems([]);
      setLoading(false);
      return () => undefined;
    }

    setLoading(true);
    setError(null);
    return subscribeGroceryList(activeHouseholdId, (nextItems) => {
      setItems(nextItems);
      setLoading(false);
    });
  }, [activeHouseholdId]);

  const uncheckedItems = useMemo(() => items.filter((item) => !item.checked), [items]);
  const checkedItems = useMemo(() => items.filter((item) => item.checked), [items]);

  const requireContext = useCallback(() => {
    if (!activeHouseholdId || !user) {
      throw new Error("Choose a household and sign in first.");
    }
    return { householdId: activeHouseholdId, userId: user.uid };
  }, [activeHouseholdId, user]);

  return {
    items,
    uncheckedItems,
    checkedItems,
    uncheckedCount: uncheckedItems.length,
    loading,
    error,
    addManualItem: useCallback(
      async (input: Omit<AddGroceryItemInput, "householdId" | "userId" | "source">) => {
        const context = requireContext();
        setError(null);
        return addManualGroceryItem({ ...input, ...context, source: "manual" });
      },
      [requireContext],
    ),
    addBuySoonItems: useCallback(
      async (buySoonItems: BuySoonItem[]) => {
        const context = requireContext();
        setError(null);
        return addBuySoonItemsToGroceryList({ ...context, items: buySoonItems });
      },
      [requireContext],
    ),
    setChecked: useCallback(
      async (itemId: string, checked: boolean) => {
        const context = requireContext();
        setError(null);
        await setGroceryItemChecked(context.householdId, itemId, checked);
      },
      [requireContext],
    ),
    deleteItem: useCallback(
      async (itemId: string) => {
        const context = requireContext();
        setError(null);
        await deleteGroceryItem(context.householdId, itemId);
      },
      [requireContext],
    ),
  };
}
