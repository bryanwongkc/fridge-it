import type { Timestamp } from "firebase/firestore";

export type ProductLocation = "fridge" | "freezer" | "pantry" | "other";
export type ProductSource =
  | "manual"
  | "manual_after_scan"
  | "open_food_facts"
  | "public_library";
export type PublicProductSource =
  | "admin_verified"
  | "open_food_facts_verified"
  | "user_submitted_verified";
export type ConfidenceLevel = "household" | "external" | "verified";

export interface PublicProduct {
  id: string;
  name: string;
  normalizedName: string;
  barcode: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  defaultUnit: string | null;
  defaultLocation: ProductLocation;
  defaultShelfLifeDays: number | null;
  aliases: string[];
  country: string | null;
  source: PublicProductSource;
  confidenceLevel: "verified";
  verified: true;
  verifiedBy: string | null;
  verifiedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  useCount: number;
}

export interface HouseholdProduct {
  id: string;
  name: string;
  normalizedName: string;
  barcode: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  defaultUnit: string | null;
  defaultLocation: ProductLocation;
  defaultShelfLifeDays: number | null;
  source: ProductSource;
  confidenceLevel: ConfidenceLevel;
  publicProductId: string | null;
  createdBy: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt: Timestamp;
  useCount: number;
}

export interface ProductInput {
  name: string;
  barcode?: string | null;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  defaultUnit?: string | null;
  defaultLocation?: ProductLocation;
  defaultShelfLifeDays?: number | null;
}

export interface ProductDraft extends ProductInput {
  source: "open_food_facts" | "manual_after_scan";
}
