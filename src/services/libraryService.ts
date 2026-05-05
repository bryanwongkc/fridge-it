import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  limit,
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
import type { HouseholdItemTemplate, TemplateDefaultsInput, UpdateTemplateInput } from "../types/library";
import type { InventoryItem } from "../types/inventory";
import { normalizeDisplayName, normalizeName } from "./normalizationService";

function cleanUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function templateFromDoc(id: string, data: Record<string, unknown>): HouseholdItemTemplate {
  const quantityMode = data.quantityMode ?? data.defaultQuantityMode;
  const defaultPercentageRemaining = data.defaultPercentageRemaining ?? data.defaultPercentage;
  const useCount = Number(data.useCount ?? data.usageCount ?? 0);

  return {
    id,
    householdId: String(data.householdId ?? ""),
    name: String(data.name ?? data.displayName ?? "Item"),
    displayName: String(data.displayName ?? data.name ?? "Item"),
    normalizedName: String(data.normalizedName ?? normalizeName(String(data.name ?? ""))),
    category: (data.category as HouseholdItemTemplate["category"]) ?? "Other",
    defaultLocation: (data.defaultLocation as HouseholdItemTemplate["defaultLocation"]) ?? "fridge",
    quantityMode: quantityMode as HouseholdItemTemplate["quantityMode"],
    defaultQuantityMode: quantityMode as HouseholdItemTemplate["defaultQuantityMode"],
    defaultQuantity: typeof data.defaultQuantity === "number" ? data.defaultQuantity : undefined,
    defaultUnit: data.defaultUnit as HouseholdItemTemplate["defaultUnit"],
    defaultPercentageRemaining:
      defaultPercentageRemaining as HouseholdItemTemplate["defaultPercentageRemaining"],
    defaultPercentage: defaultPercentageRemaining as HouseholdItemTemplate["defaultPercentage"],
    expiryPreset: data.expiryPreset as HouseholdItemTemplate["expiryPreset"],
    defaultExpiryPreset: (data.expiryPreset ?? data.defaultExpiryPreset) as HouseholdItemTemplate["defaultExpiryPreset"],
    defaultExpiryDays:
      typeof data.defaultExpiryDays === "number" ? data.defaultExpiryDays : null,
    desiredStockEnabled: Boolean(data.desiredStockEnabled ?? data.desiredStock),
    desiredMinQuantity:
      typeof data.desiredMinQuantity === "number" ? data.desiredMinQuantity : null,
    desiredMinPercentage:
      typeof data.desiredMinPercentage === "number" ? data.desiredMinPercentage : null,
    desiredStock: data.desiredStock as HouseholdItemTemplate["desiredStock"],
    barcodes: Array.isArray(data.barcodes) ? data.barcodes.map(String) : [],
    favorite: Boolean(data.favorite),
    useCount,
    usageCount: useCount,
    lastUsedAt: data.lastUsedAt as HouseholdItemTemplate["lastUsedAt"],
    createdAt: data.createdAt as HouseholdItemTemplate["createdAt"],
    updatedAt: data.updatedAt as HouseholdItemTemplate["updatedAt"],
  };
}

function templatesCollection(householdId: string) {
  return collection(db, "households", householdId, "householdItemLibrary");
}

export function subscribeHouseholdLibrary(
  householdId: string,
  callback: (templates: HouseholdItemTemplate[]) => void,
): Unsubscribe {
  const templatesQuery = query(templatesCollection(householdId), orderBy("lastUsedAt", "desc"));

  return onSnapshot(templatesQuery, (snapshot) => {
    callback(snapshot.docs.map((templateDoc) => templateFromDoc(templateDoc.id, templateDoc.data())));
  });
}

export async function getTemplateByNormalizedName(
  householdId: string,
  normalizedName: string,
): Promise<HouseholdItemTemplate | null> {
  const templateQuery = query(
    templatesCollection(householdId),
    where("normalizedName", "==", normalizedName),
    limit(1),
  );
  const snapshot = await getDocs(templateQuery);
  const templateDoc = snapshot.docs[0];
  return templateDoc ? templateFromDoc(templateDoc.id, templateDoc.data()) : null;
}

export async function createOrUpdateTemplateFromInventoryItem(
  input: TemplateDefaultsInput | InventoryItem,
): Promise<HouseholdItemTemplate> {
  const normalizedName = input.normalizedName ?? normalizeName(input.name);
  const displayName =
    "displayName" in input && input.displayName
      ? input.displayName
      : normalizeDisplayName(input.name);
  const existing = await getTemplateByNormalizedName(input.householdId, normalizedName);
  const templateRef = existing
    ? doc(db, "households", input.householdId, "householdItemLibrary", existing.id)
    : doc(templatesCollection(input.householdId));
  const barcodes = "barcodes" in input && input.barcodes ? input.barcodes : [];
  const barcode = "barcode" in input ? input.barcode : null;
  const nextBarcodes = [...new Set([...barcodes, ...(barcode ? [barcode] : [])])];
  const quantityMode = "quantityMode" in input ? input.quantityMode : undefined;
  const defaultQuantity =
    "defaultQuantity" in input ? input.defaultQuantity : "quantity" in input ? input.quantity : undefined;
  const defaultUnit =
    "defaultUnit" in input ? input.defaultUnit : "unit" in input ? input.unit : undefined;
  const defaultPercentageRemaining =
    "defaultPercentageRemaining" in input
      ? input.defaultPercentageRemaining
      : "percentage" in input
        ? input.percentage
        : undefined;
  const expiryPreset = "expiryPreset" in input ? input.expiryPreset : undefined;

  const baseData = cleanUndefined({
    householdId: input.householdId,
    name: displayName,
    displayName,
    normalizedName,
    category: input.category,
    defaultLocation: "defaultLocation" in input ? input.defaultLocation : input.location,
    quantityMode,
    defaultQuantityMode: quantityMode,
    defaultQuantity,
    defaultUnit,
    defaultPercentageRemaining,
    defaultPercentage: defaultPercentageRemaining,
    expiryPreset,
    defaultExpiryPreset: expiryPreset,
    defaultExpiryDays: "defaultExpiryDays" in input ? input.defaultExpiryDays : undefined,
    desiredStockEnabled:
      "desiredStockEnabled" in input ? Boolean(input.desiredStockEnabled) : existing?.desiredStockEnabled ?? false,
    desiredMinQuantity:
      "desiredMinQuantity" in input ? input.desiredMinQuantity : existing?.desiredMinQuantity ?? null,
    desiredMinPercentage:
      "desiredMinPercentage" in input ? input.desiredMinPercentage : existing?.desiredMinPercentage ?? null,
    favorite: "favorite" in input ? Boolean(input.favorite) : existing?.favorite ?? false,
    updatedAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
  });

  if (existing) {
    await updateDoc(templateRef, {
      ...baseData,
      ...(nextBarcodes.length ? { barcodes: arrayUnion(...nextBarcodes) } : {}),
      useCount: increment(1),
      usageCount: increment(1),
    });
  } else {
    await setDoc(templateRef, {
      ...baseData,
      barcodes: nextBarcodes,
      useCount: 1,
      usageCount: 1,
      createdAt: serverTimestamp(),
    });
  }

  return {
    ...(existing ?? {
      id: templateRef.id,
      householdId: input.householdId,
      name: displayName,
      displayName,
      normalizedName,
      category: input.category,
      defaultLocation: "defaultLocation" in input ? input.defaultLocation : input.location,
      desiredStockEnabled: false,
      barcodes: [],
      favorite: false,
      useCount: 0,
      usageCount: 0,
    }),
    id: templateRef.id,
    displayName,
    normalizedName,
  } as HouseholdItemTemplate;
}

export async function updateTemplate(
  householdId: string,
  templateId: string,
  input: UpdateTemplateInput,
): Promise<void> {
  const displayName = input.displayName?.trim();
  await updateDoc(
    doc(db, "households", householdId, "householdItemLibrary", templateId),
    cleanUndefined({
      ...input,
      displayName,
      name: displayName,
      normalizedName: displayName ? normalizeName(displayName) : undefined,
      defaultQuantityMode: input.quantityMode,
      defaultPercentage: input.defaultPercentageRemaining,
      defaultExpiryPreset: input.expiryPreset,
      updatedAt: serverTimestamp(),
    }),
  );
}

export async function setTemplateFavorite(
  householdId: string,
  templateId: string,
  favorite: boolean,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "householdItemLibrary", templateId), {
    favorite,
    updatedAt: serverTimestamp(),
  });
}

export async function attachBarcodeToTemplate(
  householdId: string,
  templateId: string,
  barcode: string,
): Promise<void> {
  const cleaned = barcode.trim();
  if (!cleaned) {
    return;
  }
  await updateDoc(doc(db, "households", householdId, "householdItemLibrary", templateId), {
    barcodes: arrayUnion(cleaned),
    updatedAt: serverTimestamp(),
  });
}
