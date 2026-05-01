import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { InventoryInput } from "../types/inventory";
import type { ProductInput } from "../types/product";
import { addDays, formatDate } from "../utils/dates";
import { normalizeText } from "../utils/normalize";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured. Add Vite Firebase env variables.");
  return db;
}

const publicProducts: ProductInput[] = [
  {
    name: "Meiji Fresh Milk 946ml",
    brand: "Meiji",
    category: "Dairy",
    defaultUnit: "bottle",
    defaultLocation: "fridge",
    defaultShelfLifeDays: 5,
  },
  {
    name: "Eggs 12 pcs",
    category: "Eggs",
    defaultUnit: "pcs",
    defaultLocation: "fridge",
    defaultShelfLifeDays: 14,
  },
  {
    name: "Tofu 300g",
    category: "Soy",
    defaultUnit: "pack",
    defaultLocation: "fridge",
    defaultShelfLifeDays: 4,
  },
  {
    name: "Frozen Dumplings",
    category: "Frozen",
    defaultUnit: "bag",
    defaultLocation: "freezer",
    defaultShelfLifeDays: 120,
  },
  {
    name: "Yogurt Cup",
    category: "Dairy",
    defaultUnit: "cup",
    defaultLocation: "fridge",
    defaultShelfLifeDays: 7,
  },
];

export async function seedDemoData(householdId: string, userId: string | null): Promise<void> {
  const firestore = requireDb();
  const publicRefs: Record<string, string> = {};

  for (const product of publicProducts) {
    const productRef = doc(collection(firestore, "publicProducts"));
    publicRefs[product.name] = productRef.id;
    await setDoc(productRef, {
      id: productRef.id,
      name: product.name,
      normalizedName: normalizeText(product.name),
      barcode: product.barcode || null,
      brand: product.brand || null,
      category: product.category || null,
      imageUrl: product.imageUrl || null,
      defaultUnit: product.defaultUnit || null,
      defaultLocation: product.defaultLocation || "fridge",
      defaultShelfLifeDays: product.defaultShelfLifeDays ?? null,
      aliases: [],
      country: "HK",
      source: "admin_verified",
      confidenceLevel: "verified",
      verified: true,
      verifiedBy: userId || "dev-admin",
      verifiedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      useCount: 0,
    });
  }

  const inventory: Array<InventoryInput & { shelfDays?: number }> = [
    {
      productId: null,
      publicProductId: publicRefs["Meiji Fresh Milk 946ml"],
      name: "Milk",
      barcode: null,
      brand: "Meiji",
      category: "Dairy",
      imageUrl: null,
      quantity: 1,
      unit: "bottle",
      location: "fridge",
      expiryDate: formatDate(addDays(new Date(), 1)),
      hasNoExpiry: false,
      notes: null,
    },
    {
      productId: null,
      publicProductId: null,
      name: "Chicken thigh",
      barcode: null,
      brand: null,
      category: "Meat",
      imageUrl: null,
      quantity: 1,
      unit: "pack",
      location: "fridge",
      expiryDate: formatDate(new Date()),
      hasNoExpiry: false,
      notes: null,
    },
    {
      productId: null,
      publicProductId: publicRefs["Eggs 12 pcs"],
      name: "Eggs",
      barcode: null,
      brand: null,
      category: "Eggs",
      imageUrl: null,
      quantity: 12,
      unit: "pcs",
      location: "fridge",
      expiryDate: formatDate(addDays(new Date(), 5)),
      hasNoExpiry: false,
      notes: null,
    },
    {
      productId: null,
      publicProductId: publicRefs["Frozen Dumplings"],
      name: "Frozen dumplings",
      barcode: null,
      brand: null,
      category: "Frozen",
      imageUrl: null,
      quantity: 1,
      unit: "bag",
      location: "freezer",
      expiryDate: null,
      hasNoExpiry: true,
      notes: null,
    },
    {
      productId: null,
      publicProductId: null,
      name: "Spinach",
      barcode: null,
      brand: null,
      category: "Vegetable",
      imageUrl: null,
      quantity: 1,
      unit: "bag",
      location: "fridge",
      expiryDate: formatDate(addDays(new Date(), 2)),
      hasNoExpiry: false,
      notes: null,
    },
  ];

  for (const item of inventory) {
    const itemRef = doc(collection(firestore, "households", householdId, "inventory"));
    await setDoc(itemRef, {
      id: itemRef.id,
      ...item,
      normalizedName: normalizeText(item.name),
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "active",
    });
  }

  for (const name of ["Kitchen paper", "Yogurt"]) {
    const shoppingRef = doc(collection(firestore, "households", householdId, "shoppingList"));
    await setDoc(shoppingRef, {
      id: shoppingRef.id,
      name,
      normalizedName: normalizeText(name),
      productId: null,
      publicProductId: null,
      quantity: null,
      unit: null,
      checked: false,
      source: "manual",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const name of ["Japanese egg tofu", "Donki milk", "Local bakery bread"]) {
    const submissionRef = doc(collection(firestore, "productSubmissions"));
    await setDoc(submissionRef, {
      id: submissionRef.id,
      householdId,
      submittedBy: userId,
      name,
      normalizedName: normalizeText(name),
      barcode: null,
      brand: name.includes("Donki") ? "Donki" : null,
      category: name.includes("bread") ? "Bakery" : null,
      imageUrl: null,
      defaultUnit: "pack",
      defaultLocation: "fridge",
      defaultShelfLifeDays: name.includes("bread") ? 2 : 5,
      source: "manual",
      status: "pending",
      duplicateOfPublicProductId: null,
      submittedCount: 1,
      submittedHouseholdIds: [householdId],
      createdAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      adminNote: null,
    });
  }
}
