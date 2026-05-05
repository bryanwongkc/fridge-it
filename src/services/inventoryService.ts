import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import type {
  CreateInventoryItemInput,
  InventoryItem,
  InventoryStatus,
  UpdateInventoryItemInput,
} from "../types/inventory";
import { normalizeName, suggestCategory } from "./normalizationService";

function inventoryItemFromDoc(id: string, data: Record<string, unknown>): InventoryItem {
  return {
    id,
    householdId: String(data.householdId ?? ""),
    templateId: typeof data.templateId === "string" ? data.templateId : null,
    barcode: typeof data.barcode === "string" ? data.barcode : null,
    name: String(data.name ?? "Unnamed item"),
    normalizedName: String(data.normalizedName ?? normalizeName(String(data.name ?? ""))),
    category: (data.category as InventoryItem["category"]) ?? "Other",
    location: (data.location as InventoryItem["location"]) ?? "other",
    quantityMode: data.quantityMode as InventoryItem["quantityMode"],
    percentage: data.percentage as InventoryItem["percentage"],
    quantity: typeof data.quantity === "number" ? data.quantity : undefined,
    unit: data.unit as InventoryItem["unit"],
    expiryKnown: typeof data.expiryKnown === "boolean" ? data.expiryKnown : Boolean(data.expiryDate),
    expiryDate: typeof data.expiryDate === "string" ? data.expiryDate : null,
    expiryPreset: data.expiryPreset as InventoryItem["expiryPreset"],
    status: (data.status as InventoryStatus) ?? "available",
    addedBy: String(data.addedBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
    createdAt: data.createdAt as InventoryItem["createdAt"],
    updatedAt: data.updatedAt as InventoryItem["updatedAt"],
    consumedAt: (data.consumedAt as InventoryItem["consumedAt"]) ?? null,
    discardedAt: (data.discardedAt as InventoryItem["discardedAt"]) ?? null,
    keptAt: (data.keptAt as InventoryItem["keptAt"]) ?? null,
    deletedAt: (data.deletedAt as InventoryItem["deletedAt"]) ?? null,
  };
}

function cleanUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function subscribeInventoryItems(
  householdId: string,
  callback: (items: InventoryItem[]) => void,
  options: { includeDeleted?: boolean } = {},
): Unsubscribe {
  const inventoryQuery = query(
    collection(db, "households", householdId, "inventoryItems"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(inventoryQuery, (snapshot) => {
    const items = snapshot.docs
      .map((itemDoc) => inventoryItemFromDoc(itemDoc.id, itemDoc.data()))
      .filter((item) => options.includeDeleted || item.status !== "deleted");
    callback(items);
  });
}

export async function getInventoryItem(
  householdId: string,
  itemId: string,
): Promise<InventoryItem | null> {
  const snapshot = await getDoc(doc(db, "households", householdId, "inventoryItems", itemId));
  return snapshot.exists() ? inventoryItemFromDoc(snapshot.id, snapshot.data()) : null;
}

export async function createInventoryItem(input: CreateInventoryItemInput): Promise<string> {
  const itemRef = doc(collection(db, "households", input.householdId, "inventoryItems"));
  const expiryKnown = input.expiryKnown ?? Boolean(input.expiryDate);
  const name = input.name.trim();

  await setDoc(
    itemRef,
    cleanUndefined({
      householdId: input.householdId,
      templateId: input.templateId ?? null,
      barcode: input.barcode?.trim() || null,
      name,
      normalizedName: normalizeName(name),
      category: input.category ?? suggestCategory(name),
      location: input.location,
      quantityMode: input.quantityMode,
      percentage: input.percentage,
      quantity: input.quantity,
      unit: input.unit,
      expiryKnown,
      expiryDate: expiryKnown ? input.expiryDate ?? null : null,
      expiryPreset: input.expiryPreset ?? (expiryKnown ? "custom" : "unknown"),
      status: "available",
      addedBy: input.userId,
      updatedBy: input.userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      consumedAt: null,
      discardedAt: null,
      keptAt: null,
      deletedAt: null,
    }),
  );

  return itemRef.id;
}

export async function updateInventoryItem(
  householdId: string,
  itemId: string,
  input: UpdateInventoryItemInput,
): Promise<void> {
  const nextName = input.name?.trim();
  await updateDoc(
    doc(db, "households", householdId, "inventoryItems", itemId),
    cleanUndefined({
      ...input,
      name: nextName,
      normalizedName: nextName ? normalizeName(nextName) : undefined,
      barcode: input.barcode === undefined ? undefined : input.barcode?.trim() || null,
      percentage: input.percentage,
      quantity: input.quantity,
      unit: input.unit,
      expiryDate: input.expiryKnown === false ? null : input.expiryDate,
      updatedAt: serverTimestamp(),
    }),
  );
}

export async function softDeleteInventoryItem(
  householdId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "inventoryItems", itemId), {
    status: "deleted",
    updatedBy: userId,
    updatedAt: serverTimestamp(),
    deletedAt: serverTimestamp(),
  });
}

export async function markConsumed(
  householdId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "inventoryItems", itemId), {
    status: "consumed",
    updatedBy: userId,
    updatedAt: serverTimestamp(),
    consumedAt: serverTimestamp(),
  });
}

export async function markDiscarded(
  householdId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "inventoryItems", itemId), {
    status: "discarded",
    updatedBy: userId,
    updatedAt: serverTimestamp(),
    discardedAt: serverTimestamp(),
  });
}

export async function keepExpiredItem(
  householdId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "inventoryItems", itemId), {
    status: "kept",
    updatedBy: userId,
    updatedAt: serverTimestamp(),
    keptAt: serverTimestamp(),
  });
}

export async function extendExpiry(
  householdId: string,
  itemId: string,
  userId: string,
  expiryDate: string,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "inventoryItems", itemId), {
    status: "available",
    expiryKnown: true,
    expiryDate,
    expiryPreset: "custom",
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}
