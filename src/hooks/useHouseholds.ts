import { useCallback, useEffect, useState } from "react";
import {
  createHousehold,
  subscribeUserHouseholds,
  switchActiveHousehold,
} from "../services/householdService";
import type { Household } from "../types/household";
import { useAuth } from "./useAuth";

export function useHouseholds() {
  const { user, appUser } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setHouseholds([]);
      setLoading(false);
      return () => undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeUserHouseholds(appUser.householdIds, (nextHouseholds) => {
      setHouseholds(nextHouseholds);
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser]);

  const createNewHousehold = useCallback(
    async (name: string) => {
      if (!user) {
        throw new Error("You need to sign in first.");
      }

      setError(null);
      return createHousehold({
        name,
        ownerId: user.uid,
        ownerDisplayName: user.displayName,
        ownerEmail: user.email,
      });
    },
    [user],
  );

  const setActiveHousehold = useCallback(
    async (householdId: string) => {
      if (!user) {
        throw new Error("You need to sign in first.");
      }

      setError(null);
      await switchActiveHousehold(user.uid, householdId);
    },
    [user],
  );

  return {
    households,
    loading,
    error,
    createNewHousehold,
    setActiveHousehold,
  };
}
