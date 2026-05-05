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
  type Unsubscribe,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import type { AddGroceryItemInput, GroceryListItem } from "../types/grocery";
import type { BuySoonItem } from "./buySoonService";
import { normalizeName } from "./normalizationService";

function groceryItemFromDoc(id: string, data: Record<string, unknown>): GroceryListItem {
  return {
    id,
    householdId: String(data.householdId ?? ""),
    templateId: typeof data.templateId === "string" ? data.templateId : null,
    name: String(data.name ?? "Grocery item"),
    normalizedName: String(data.normalizedName ?? normalizeName(String(data.name ?? ""))),
    quantity: typeof data.quantity === "number" ? data.quantity : undefined,
    unit: data.unit as GroceryListItem["unit"],
    checked: Boolean(data.checked),
    source: data.source === "buy_soon" ? "buy_soon" : "manual",
    reason: typeof data.reason === "string" ? data.reason : null,
    createdBy: String(data.createdBy ?? ""),
    createdAt: data.createdAt as GroceryListItem["createdAt"],
    updatedAt: data.updatedAt as GroceryListItem["updatedAt"],
    checkedAt: (data.checkedAt as GroceryListItem["checkedAt"]) ?? null,
  };
}

function groceryCollection(householdId: string) {
  return collection(db, "households", householdId, "groceryListItems");
}

function cleanUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function subscribeGroceryList(
  householdId: string,
  callback: (items: GroceryListItem[]) => void,
): Unsubscribe {
  const groceryQuery = query(groceryCollection(householdId), orderBy("createdAt", "desc"));
  return onSnapshot(groceryQuery, (snapshot) => {
    callback(snapshot.docs.map((itemDoc) => groceryItemFromDoc(itemDoc.id, itemDoc.data())));
  });
}

async function hasUncheckedDuplicate(input: AddGroceryItemInput): Promise<boolean> {
  const constraints = [where("checked", "==", false)];
  if (input.templateId) {
    constraints.push(where("templateId", "==", input.templateId));
  } else {
    constraints.push(where("normalizedName", "==", normalizeName(input.name)));
  }

  const duplicateQuery = query(groceryCollection(input.householdId), ...constraints);
  const snapshot = await getDocs(duplicateQuery);
  return !snapshot.empty;
}

export async function addManualGroceryItem(input: AddGroceryItemInput): Promise<string | null> {
  if (await hasUncheckedDuplicate(input)) {
    return null;
  }

  const itemRef = doc(groceryCollection(input.householdId));
  await setDoc(
    itemRef,
    cleanUndefined({
      householdId: input.householdId,
      templateId: input.templateId ?? null,
      name: input.name.trim(),
      normalizedName: normalizeName(input.name),
      quantity: input.quantity,
      unit: input.unit,
      checked: false,
      source: input.source,
      reason: input.reason ?? null,
      createdBy: input.userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      checkedAt: null,
    }),
  );
  return itemRef.id;
}

export async function addBuySoonItemsToGroceryList(input: {
  householdId: string;
  userId: string;
  items: BuySoonItem[];
}): Promise<number> {
  let added = 0;
  for (const item of input.items) {
    const id = await addManualGroceryItem({
      householdId: input.householdId,
      userId: input.userId,
      templateId: item.templateId,
      name: item.displayName,
      quantity: item.suggestedQuantity,
      unit: item.unit as AddGroceryItemInput["unit"],
      source: "buy_soon",
      reason: item.reason,
    });
    if (id) {
      added += 1;
    }
  }
  return added;
}

export async function setGroceryItemChecked(
  householdId: string,
  itemId: string,
  checked: boolean,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "groceryListItems", itemId), {
    checked,
    checkedAt: checked ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGroceryItem(householdId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, "households", householdId, "groceryListItems", itemId));
}
