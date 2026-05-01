import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ShoppingItem, ShoppingSource } from "../types/shopping";
import { normalizeText } from "../utils/normalize";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured. Add Vite Firebase env variables.");
  return db;
}

function shoppingRef(householdId: string) {
  return collection(requireDb(), "households", householdId, "shoppingList");
}

export function subscribeShoppingList(
  householdId: string,
  onNext: (items: ShoppingItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(shoppingRef(householdId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((item) => item.data() as ShoppingItem)),
    onError,
  );
}

export async function addShoppingItem(
  householdId: string,
  input: {
    name: string;
    productId?: string | null;
    publicProductId?: string | null;
    quantity?: number | null;
    unit?: string | null;
    source?: ShoppingSource;
  },
): Promise<void> {
  const itemRef = doc(shoppingRef(householdId));
  await setDoc(itemRef, {
    id: itemRef.id,
    name: input.name.trim(),
    normalizedName: normalizeText(input.name),
    productId: input.productId || null,
    publicProductId: input.publicProductId || null,
    quantity: input.quantity ?? null,
    unit: input.unit || null,
    checked: false,
    source: input.source || "manual",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateShoppingItem(
  householdId: string,
  itemId: string,
  fields: Partial<Pick<ShoppingItem, "checked" | "quantity" | "unit" | "name">>,
): Promise<void> {
  const update: Record<
    string,
    string | number | boolean | null | ReturnType<typeof serverTimestamp>
  > = {
    updatedAt: serverTimestamp(),
  };
  if (fields.checked !== undefined) update.checked = fields.checked;
  if (fields.quantity !== undefined) update.quantity = fields.quantity;
  if (fields.unit !== undefined) update.unit = fields.unit;
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.name) update.normalizedName = normalizeText(fields.name);
  await updateDoc(doc(shoppingRef(householdId), itemId), update);
}

export async function deleteShoppingItem(householdId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(shoppingRef(householdId), itemId));
}
