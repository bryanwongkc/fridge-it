import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createInventoryItem,
  extendExpiry,
  keepExpiredItem,
  markConsumed,
  markDiscarded,
  softDeleteInventoryItem,
  subscribeInventoryItems,
  updateInventoryItem,
} from "../services/inventoryService";
import type {
  CreateInventoryItemInput,
  ExpiryStatus,
  InventoryItem,
  UpdateInventoryItemInput,
} from "../types/inventory";
import { calculateExpiryStatus } from "../utils/dateUtils";
import { useActiveHousehold } from "./useActiveHousehold";
import { useAuth } from "./useAuth";

export interface InventoryItemWithExpiry extends InventoryItem {
  expiryStatus: ExpiryStatus;
}

export function useInventory(options: { includeDeleted?: boolean; includeInactive?: boolean } = {}) {
  const { user } = useAuth();
  const { activeHouseholdId } = useActiveHousehold();
  const [items, setItems] = useState<InventoryItem[]>([]);
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
    const unsubscribe = subscribeInventoryItems(
      activeHouseholdId,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      options,
    );

    return unsubscribe;
  }, [activeHouseholdId, options.includeDeleted]);

  const itemsWithExpiry = useMemo<InventoryItemWithExpiry[]>(
    () =>
      items
        .filter(
          (item) =>
            options.includeInactive ||
            (item.status !== "consumed" && item.status !== "discarded"),
        )
        .map((item) => ({
          ...item,
          expiryStatus: calculateExpiryStatus({
            expiryKnown: item.expiryKnown,
            expiryDate: item.expiryDate,
          }),
        })),
    [items, options.includeInactive],
  );

  const counts = useMemo(() => {
    const byLocation = {
      fridge: 0,
      freezer: 0,
      pantry: 0,
      other: 0,
    };
    let expired = 0;
    let expiringSoon = 0;
    let unknown = 0;
    let fresh = 0;

    for (const item of itemsWithExpiry) {
      byLocation[item.location] += 1;
      if (item.expiryStatus === "expired") {
        expired += 1;
      } else if (item.expiryStatus === "expiringSoon") {
        expiringSoon += 1;
      } else if (item.expiryStatus === "unknown") {
        unknown += 1;
      } else {
        fresh += 1;
      }
    }

    return {
      total: itemsWithExpiry.length,
      expired,
      expiringSoon,
      unknown,
      fresh,
      byLocation,
    };
  }, [itemsWithExpiry]);

  const requireContext = useCallback(() => {
    if (!activeHouseholdId || !user) {
      throw new Error("Choose a household and sign in first.");
    }

    return { householdId: activeHouseholdId, userId: user.uid };
  }, [activeHouseholdId, user]);

  return {
    items: itemsWithExpiry,
    loading,
    error,
    counts,
    activeHouseholdId,
    createItem: useCallback(
      async (input: Omit<CreateInventoryItemInput, "householdId" | "userId">) => {
        const context = requireContext();
        setError(null);
        return createInventoryItem({ ...input, ...context });
      },
      [requireContext],
    ),
    updateItem: useCallback(
      async (itemId: string, input: Omit<UpdateInventoryItemInput, "updatedBy">) => {
        const context = requireContext();
        setError(null);
        await updateInventoryItem(context.householdId, itemId, {
          ...input,
          updatedBy: context.userId,
        });
      },
      [requireContext],
    ),
    softDeleteItem: useCallback(
      async (itemId: string) => {
        const context = requireContext();
        setError(null);
        await softDeleteInventoryItem(context.householdId, itemId, context.userId);
      },
      [requireContext],
    ),
    markItemConsumed: useCallback(
      async (itemId: string) => {
        const context = requireContext();
        setError(null);
        await markConsumed(context.householdId, itemId, context.userId);
      },
      [requireContext],
    ),
    markItemDiscarded: useCallback(
      async (itemId: string) => {
        const context = requireContext();
        setError(null);
        await markDiscarded(context.householdId, itemId, context.userId);
      },
      [requireContext],
    ),
    keepItemForNow: useCallback(
      async (itemId: string) => {
        const context = requireContext();
        setError(null);
        await keepExpiredItem(context.householdId, itemId, context.userId);
      },
      [requireContext],
    ),
    extendItemExpiry: useCallback(
      async (itemId: string, expiryDate: string) => {
        const context = requireContext();
        setError(null);
        await extendExpiry(context.householdId, itemId, context.userId, expiryDate);
      },
      [requireContext],
    ),
  };
}
