import { useCallback, useState } from "react";
import { handleBarcodeScan } from "../services/barcodeService";
import type { BarcodeLookupResult } from "../types/barcode";
import { useActiveHousehold } from "./useActiveHousehold";

export function useBarcodeLookup() {
  const { activeHouseholdId } = useActiveHousehold();
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupBarcode = useCallback(
    async (barcode: string) => {
      if (!activeHouseholdId) {
        throw new Error("Choose a household first.");
      }
      setLoading(true);
      setError(null);
      try {
        const nextResult = await handleBarcodeScan(barcode, activeHouseholdId);
        setResult(nextResult);
        return nextResult;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Barcode lookup failed.";
        setError(message);
        throw caughtError;
      } finally {
        setLoading(false);
      }
    },
    [activeHouseholdId],
  );

  return { lookupBarcode, loading, error, result };
}
