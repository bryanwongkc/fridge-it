import {
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  collection,
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import type {
  BarcodeCacheEntry,
  BarcodeLookupResult,
  BarcodeProductIndexEntry,
} from "../types/barcode";
import type { HouseholdItemTemplate } from "../types/library";
import { lookupOpenFoodFacts } from "./openFoodFactsService";

function templateFromDoc(id: string, data: Record<string, unknown>): HouseholdItemTemplate {
  const useCount = Number(data.useCount ?? data.usageCount ?? 0);
  return {
    id,
    householdId: String(data.householdId ?? ""),
    name: String(data.name ?? data.displayName ?? "Item"),
    displayName: String(data.displayName ?? data.name ?? "Item"),
    normalizedName: String(data.normalizedName ?? ""),
    category: (data.category as HouseholdItemTemplate["category"]) ?? "Other",
    defaultLocation: (data.defaultLocation as HouseholdItemTemplate["defaultLocation"]) ?? "fridge",
    quantityMode: data.quantityMode as HouseholdItemTemplate["quantityMode"],
    defaultQuantityMode: data.defaultQuantityMode as HouseholdItemTemplate["defaultQuantityMode"],
    defaultQuantity: typeof data.defaultQuantity === "number" ? data.defaultQuantity : undefined,
    defaultUnit: data.defaultUnit as HouseholdItemTemplate["defaultUnit"],
    defaultPercentageRemaining:
      data.defaultPercentageRemaining as HouseholdItemTemplate["defaultPercentageRemaining"],
    defaultPercentage: data.defaultPercentage as HouseholdItemTemplate["defaultPercentage"],
    expiryPreset: data.expiryPreset as HouseholdItemTemplate["expiryPreset"],
    defaultExpiryPreset: data.defaultExpiryPreset as HouseholdItemTemplate["defaultExpiryPreset"],
    defaultExpiryDays:
      typeof data.defaultExpiryDays === "number" ? data.defaultExpiryDays : null,
    desiredStockEnabled: Boolean(data.desiredStockEnabled),
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

export async function getHouseholdBarcodeIndex(
  householdId: string,
  barcode: string,
): Promise<BarcodeProductIndexEntry | null> {
  const snapshot = await getDoc(doc(db, "households", householdId, "barcodeProductIndex", barcode));
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data();
  return {
    barcode,
    householdId,
    templateId: String(data.templateId ?? ""),
    normalizedName: String(data.normalizedName ?? ""),
    displayName: String(data.displayName ?? ""),
    category: (data.category as BarcodeProductIndexEntry["category"]) ?? "Other",
    defaultLocation: (data.defaultLocation as BarcodeProductIndexEntry["defaultLocation"]) ?? "fridge",
    createdAt: data.createdAt as BarcodeProductIndexEntry["createdAt"],
    updatedAt: data.updatedAt as BarcodeProductIndexEntry["updatedAt"],
  };
}

export async function saveHouseholdBarcodeIndex(
  householdId: string,
  barcode: string,
  template: Pick<
    HouseholdItemTemplate,
    "id" | "displayName" | "normalizedName" | "category" | "defaultLocation"
  >,
): Promise<void> {
  const cleaned = barcode.trim();
  if (!cleaned) {
    return;
  }
  await setDoc(
    doc(db, "households", householdId, "barcodeProductIndex", cleaned),
    {
      barcode: cleaned,
      householdId,
      templateId: template.id,
      normalizedName: template.normalizedName,
      displayName: template.displayName,
      category: template.category,
      defaultLocation: template.defaultLocation,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteHouseholdBarcodeIndex(
  householdId: string,
  barcode: string,
): Promise<void> {
  await deleteDoc(doc(db, "households", householdId, "barcodeProductIndex", barcode));
}

export async function findTemplateByBarcode(
  householdId: string,
  barcode: string,
): Promise<HouseholdItemTemplate | null> {
  const templateQuery = query(
    collection(db, "households", householdId, "householdItemLibrary"),
    where("barcodes", "array-contains", barcode),
    limit(1),
  );
  const snapshot = await getDocs(templateQuery);
  const templateDoc = snapshot.docs[0];
  return templateDoc ? templateFromDoc(templateDoc.id, templateDoc.data()) : null;
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

export async function getBarcodeCache(barcode: string): Promise<BarcodeCacheEntry | null> {
  const snapshot = await getDoc(doc(db, "barcodeCache", barcode));
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data();
  return {
    barcode,
    source: data.source === "manual" ? "manual" : "open_food_facts",
    name: typeof data.name === "string" ? data.name : undefined,
    normalizedName: typeof data.normalizedName === "string" ? data.normalizedName : undefined,
    brand: typeof data.brand === "string" ? data.brand : undefined,
    category: data.category as BarcodeCacheEntry["category"],
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    found: Boolean(data.found),
    lastFetchedAt: data.lastFetchedAt as BarcodeCacheEntry["lastFetchedAt"],
    quality: data.quality as BarcodeCacheEntry["quality"],
    quantity: typeof data.quantity === "string" ? data.quantity : null,
    categories: typeof data.categories === "string" ? data.categories : null,
  };
}

export async function saveBarcodeCache(entry: BarcodeCacheEntry): Promise<void> {
  const data = Object.fromEntries(
    Object.entries({
      ...entry,
      lastFetchedAt: serverTimestamp(),
    }).filter(([, value]) => value !== undefined),
  );
  await setDoc(
    doc(db, "barcodeCache", entry.barcode),
    data,
    { merge: true },
  );
}

export async function handleBarcodeScan(
  barcode: string,
  householdId: string,
): Promise<BarcodeLookupResult> {
  const cleaned = barcode.trim();
  if (!cleaned) {
    throw new Error("Enter a barcode first.");
  }

  const indexEntry = await getHouseholdBarcodeIndex(householdId, cleaned);
  if (indexEntry) {
    return {
      status: "household_index",
      barcode: cleaned,
      indexEntry,
      message: "Found from your household memory.",
    };
  }

  const template = await findTemplateByBarcode(householdId, cleaned);
  if (template) {
    await saveHouseholdBarcodeIndex(householdId, cleaned, template);
    return {
      status: "household_template",
      barcode: cleaned,
      template,
      message: "Found from your household memory.",
    };
  }

  const cacheEntry = await getBarcodeCache(cleaned);
  if (cacheEntry?.found && cacheEntry.quality === "good") {
    return {
      status: "cache",
      barcode: cleaned,
      cacheEntry,
      message: "Found product details. You can still edit before saving.",
    };
  }

  const openFoodFacts = await lookupOpenFoodFacts(cleaned);
  await saveBarcodeCache(openFoodFacts.cacheEntry);
  if (openFoodFacts.product) {
    return {
      status: "open_food_facts",
      barcode: cleaned,
      product: openFoodFacts.product,
      message: "Found product details. You can still edit before saving.",
    };
  }

  return {
    status: "manual",
    barcode: cleaned,
    message: "No clean product details found. Add it once and barcode will work next time.",
  };
}
