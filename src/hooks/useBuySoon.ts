import { useMemo } from "react";
import { calculateBuySoonItems } from "../services/buySoonService";
import { useHouseholdLibrary } from "./useHouseholdLibrary";
import { useInventory } from "./useInventory";

export function useBuySoon() {
  const inventory = useInventory();
  const library = useHouseholdLibrary();

  const buySoonItems = useMemo(
    () => calculateBuySoonItems(library.templates, inventory.items),
    [inventory.items, library.templates],
  );

  return {
    buySoonItems,
    count: buySoonItems.length,
    loading: inventory.loading || library.loading,
  };
}
