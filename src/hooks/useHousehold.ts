import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";

const householdStorageKey = "fridge-control-household-id";
const adminStorageKey = "fridge-control-admin-mode";

export function useHousehold() {
  const [householdId, setHouseholdIdState] = useState<string | null>(() =>
    localStorage.getItem(householdStorageKey),
  );
  const [adminMode, setAdminModeState] = useState(
    () => localStorage.getItem(adminStorageKey) === "true",
  );

  useEffect(() => {
    if (!db || !householdId) return;
    void setDoc(
      doc(db, "households", householdId, "settings", "main"),
      {
        householdId,
        displayName: householdId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [householdId]);

  const setHouseholdId = (value: string) => {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return;
    localStorage.setItem(householdStorageKey, normalized);
    setHouseholdIdState(normalized);
  };

  const clearHousehold = () => {
    localStorage.removeItem(householdStorageKey);
    setHouseholdIdState(null);
  };

  const setAdminMode = (value: boolean) => {
    localStorage.setItem(adminStorageKey, String(value));
    setAdminModeState(value);
  };

  return useMemo(
    () => ({
      householdId,
      setHouseholdId,
      clearHousehold,
      adminMode,
      setAdminMode,
    }),
    [adminMode, householdId],
  );
}
