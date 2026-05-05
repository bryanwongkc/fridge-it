import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useHouseholds } from "./useHouseholds";

export function useActiveHousehold() {
  const { appUser } = useAuth();
  const householdsState = useHouseholds();

  const activeHousehold = useMemo(
    () =>
      householdsState.households.find(
        (household) => household.id === appUser?.activeHouseholdId,
      ) ?? null,
    [appUser?.activeHouseholdId, householdsState.households],
  );

  return {
    ...householdsState,
    activeHouseholdId: appUser?.activeHouseholdId ?? null,
    activeHousehold,
    hasHouseholds: householdsState.households.length > 0,
  };
}
