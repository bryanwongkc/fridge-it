import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { InventoryInput, InventoryItem, InventoryStatus } from "../types/inventory";
import { normalizeText } from "../utils/normalize";
import { touchProductUsage } from "./productsService";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured. Add Vite Firebase env variables.");
  return db;
}

function inventoryRef(householdId: string) {
  return collection(requireDb(), "households", householdId, "inventory");
}

export function subscribeInventory(
  householdId: string,
  onNext: (items: InventoryItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(inventoryRef(householdId), orderBy("addedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((item) => item.data() as InventoryItem)),
    onError,
  );
}

export async function findMergeCandidate(
  householdId: string,
  input: InventoryInput,
): Promise<InventoryItem | null> {
  const q = query(
    inventoryRef(householdId),
    where("normalizedName", "==", normalizeText(input.name)),
    where("expiryDate", "==", input.expiryDate),
    where("location", "==", input.location),
    where("status", "==", "active"),
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : (snapshot.docs[0].data() as InventoryItem);
}

export async function createInventoryItem(
  householdId: string,
  input: InventoryInput,
): Promise<string> {
  const itemRef = doc(inventoryRef(householdId));
  await setDoc(itemRef, {
    id: itemRef.id,
    ...input,
    normalizedName: normalizeText(input.name),
    addedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "active",
  });

  if (input.productId) {
    await touchProductUsage(householdId, input.productId);
  }

  return itemRef.id;
}

export async function mergeInventoryQuantity(
  householdId: string,
  itemId: string,
  nextQuantity: number,
): Promise<void> {
  await updateDoc(doc(inventoryRef(householdId), itemId), {
    quantity: nextQuantity,
    updatedAt: serverTimestamp(),
  });
}

export async function updateInventoryItem(
  householdId: string,
  itemId: string,
  fields: Partial<
    Pick<
      InventoryItem,
      "quantity" | "unit" | "location" | "expiryDate" | "hasNoExpiry" | "notes" | "status"
    >
  >,
): Promise<void> {
  await updateDoc(doc(inventoryRef(householdId), itemId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function setInventoryStatus(
  householdId: string,
  item: InventoryItem,
  status: InventoryStatus,
): Promise<void> {
  await updateInventoryItem(householdId, item.id, { status });
}

export async function reduceInventoryQuantity(
  householdId: string,
  item: InventoryItem,
  amount: number,
): Promise<void> {
  const nextQuantity = Math.max(0, item.quantity - amount);
  if (nextQuantity === 0) {
    await setInventoryStatus(householdId, item, "used");
    return;
  }
  await updateInventoryItem(householdId, item.id, { quantity: nextQuantity });
}

export async function deleteInventoryItem(householdId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(inventoryRef(householdId), itemId));
}
