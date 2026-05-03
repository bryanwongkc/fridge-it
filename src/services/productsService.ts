import {
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
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { HouseholdProduct, ProductInput, PublicProduct } from "../types/product";
import { normalizeText } from "../utils/normalize";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured. Add Vite Firebase env variables.");
  return db;
}

function householdProductsRef(householdId: string) {
  return collection(requireDb(), "households", householdId, "products");
}

function publicProductsRef() {
  return collection(requireDb(), "publicProducts");
}

function inventoryRef(householdId: string) {
  return collection(requireDb(), "households", householdId, "inventory");
}

export function subscribeHouseholdProducts(
  householdId: string,
  onNext: (products: HouseholdProduct[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(householdProductsRef(householdId), orderBy("lastUsedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => item.data() as HouseholdProduct));
    },
    onError,
  );
}

export function subscribePublicProducts(
  onNext: (products: PublicProduct[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(publicProductsRef(), orderBy("useCount", "desc"), limit(200));
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((item) => item.data() as PublicProduct)),
    onError,
  );
}

export async function findPersonalProductByBarcode(
  householdId: string,
  barcode: string,
): Promise<HouseholdProduct | null> {
  const q = query(householdProductsRef(householdId), where("barcode", "==", barcode), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : (snapshot.docs[0].data() as HouseholdProduct);
}

export async function findPublicProductByBarcode(barcode: string): Promise<PublicProduct | null> {
  const q = query(publicProductsRef(), where("barcode", "==", barcode), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : (snapshot.docs[0].data() as PublicProduct);
}

export async function createPersonalProduct(
  householdId: string,
  input: ProductInput,
  source: HouseholdProduct["source"],
  confidenceLevel: HouseholdProduct["confidenceLevel"],
  publicProductId: string | null,
  createdBy: string | null,
): Promise<HouseholdProduct> {
  const productRef = doc(householdProductsRef(householdId));
  const now = serverTimestamp();
  const product: Record<string, unknown> = {
    id: productRef.id,
    name: input.name.trim(),
    normalizedName: normalizeText(input.name),
    barcode: input.barcode || null,
    brand: input.brand || null,
    category: input.category || null,
    imageUrl: input.imageUrl || null,
    defaultUnit: input.defaultUnit || null,
    defaultLocation: input.defaultLocation || "fridge",
    defaultShelfLifeDays: input.defaultShelfLifeDays ?? null,
    source,
    confidenceLevel,
    publicProductId,
    createdBy,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    useCount: 0,
  };
  await setDoc(productRef, product);
  return product as unknown as HouseholdProduct;
}

export async function createPersonalProductFromPublic(
  householdId: string,
  publicProduct: PublicProduct,
  createdBy: string | null,
): Promise<HouseholdProduct> {
  const existing = publicProduct.barcode
    ? await findPersonalProductByBarcode(householdId, publicProduct.barcode)
    : null;
  if (existing) return existing;

  return createPersonalProduct(
    householdId,
    {
      name: publicProduct.name,
      barcode: publicProduct.barcode,
      brand: publicProduct.brand,
      category: publicProduct.category,
      imageUrl: publicProduct.imageUrl,
      defaultUnit: publicProduct.defaultUnit,
      defaultLocation: publicProduct.defaultLocation,
      defaultShelfLifeDays: publicProduct.defaultShelfLifeDays,
    },
    "public_library",
    "verified",
    publicProduct.id,
    createdBy,
  );
}

export async function createPersonalProductFromOpenFoodFacts(
  householdId: string,
  input: ProductInput,
  createdBy: string | null,
): Promise<HouseholdProduct> {
  return createPersonalProduct(
    householdId,
    input,
    "open_food_facts",
    "external",
    null,
    createdBy,
  );
}

export async function touchProductUsage(householdId: string, productId: string): Promise<void> {
  await updateDoc(doc(householdProductsRef(householdId), productId), {
    lastUsedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    useCount: increment(1),
  });
}

export async function updatePersonalProduct(
  householdId: string,
  productId: string,
  input: ProductInput,
): Promise<void> {
  const normalizedName = normalizeText(input.name);
  await updateDoc(doc(householdProductsRef(householdId), productId), {
    name: input.name.trim(),
    normalizedName,
    barcode: input.barcode || null,
    brand: input.brand || null,
    category: input.category || null,
    imageUrl: input.imageUrl || null,
    defaultUnit: input.defaultUnit || null,
    defaultLocation: input.defaultLocation || "fridge",
    defaultShelfLifeDays: input.defaultShelfLifeDays ?? null,
    updatedAt: serverTimestamp(),
  });
  await updateInventorySnapshotsForProduct(householdId, productId, input, normalizedName);
}

async function updateInventorySnapshotsForProduct(
  householdId: string,
  productId: string,
  input: ProductInput,
  normalizedName: string,
): Promise<void> {
  const snapshot = await getDocs(
    query(inventoryRef(householdId), where("productId", "==", productId)),
  );
  if (snapshot.empty) return;

  const batch = writeBatch(requireDb());
  snapshot.docs.forEach((item) => {
    batch.update(item.ref, {
      name: input.name.trim(),
      normalizedName,
      barcode: input.barcode || null,
      brand: input.brand || null,
      category: input.category || null,
      imageUrl: input.imageUrl || null,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function createPublicProductFromSubmission(
  submission: {
    name: string;
    barcode: string | null;
    brand: string | null;
    category: string | null;
    imageUrl: string | null;
    defaultUnit: string | null;
    defaultLocation: PublicProduct["defaultLocation"];
    defaultShelfLifeDays: number | null;
  },
  verifiedBy: string | null,
): Promise<string> {
  const publicRef = doc(publicProductsRef());
  const now = serverTimestamp();
  await setDoc(publicRef, {
    id: publicRef.id,
    name: submission.name.trim(),
    normalizedName: normalizeText(submission.name),
    barcode: submission.barcode,
    brand: submission.brand,
    category: submission.category,
    imageUrl: submission.imageUrl,
    defaultUnit: submission.defaultUnit,
    defaultLocation: submission.defaultLocation,
    defaultShelfLifeDays: submission.defaultShelfLifeDays,
    aliases: [],
    country: null,
    source: "user_submitted_verified",
    confidenceLevel: "verified",
    verified: true,
    verifiedBy,
    verifiedAt: now,
    createdAt: now,
    updatedAt: now,
    useCount: 0,
  });
  return publicRef.id;
}

export async function seedPublicProduct(input: ProductInput): Promise<void> {
  const productRef = doc(publicProductsRef());
  await setDoc(productRef, {
    id: productRef.id,
    name: input.name,
    normalizedName: normalizeText(input.name),
    barcode: input.barcode || null,
    brand: input.brand || null,
    category: input.category || null,
    imageUrl: input.imageUrl || null,
    defaultUnit: input.defaultUnit || null,
    defaultLocation: input.defaultLocation || "fridge",
    defaultShelfLifeDays: input.defaultShelfLifeDays ?? null,
    aliases: [],
    country: "HK",
    source: "admin_verified",
    confidenceLevel: "verified",
    verified: true,
    verifiedBy: "seed",
    verifiedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    useCount: 0,
  });
}
