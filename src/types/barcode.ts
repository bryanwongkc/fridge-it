import type { Timestamp } from "firebase/firestore";
import type { HouseholdLocation } from "./household";
import type { Category } from "./inventory";
import type { HouseholdItemTemplate } from "./library";

export interface BarcodeProductIndexEntry {
  barcode: string;
  householdId: string;
  templateId: string;
  normalizedName: string;
  displayName: string;
  category: Category;
  defaultLocation: HouseholdLocation;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BarcodeCacheEntry {
  barcode: string;
  source: "open_food_facts" | "manual";
  name?: string;
  normalizedName?: string;
  brand?: string;
  category?: Category;
  imageUrl?: string;
  found: boolean;
  lastFetchedAt?: Timestamp;
  quality?: "good" | "poor";
  quantity?: string | null;
  categories?: string | null;
}

export interface NormalizedProduct {
  id: string;
  barcode?: string;
  normalizedName: string;
  displayName: string;
  brand?: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  category?: Category;
  source: "open_food_facts" | "manual" | "future_public_library";
  quality: "good" | "poor";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RawOpenFoodFactsResponse {
  id: string;
  barcode: string;
  fetchedAt?: Timestamp;
  response: unknown;
}

export type BarcodeLookupResult =
  | {
      status: "household_index";
      barcode: string;
      indexEntry: BarcodeProductIndexEntry;
      template?: HouseholdItemTemplate | null;
      message: string;
    }
  | {
      status: "household_template";
      barcode: string;
      template: HouseholdItemTemplate;
      message: string;
    }
  | {
      status: "cache";
      barcode: string;
      cacheEntry: BarcodeCacheEntry;
      message: string;
    }
  | {
      status: "open_food_facts";
      barcode: string;
      product: NormalizedProduct;
      message: string;
    }
  | {
      status: "manual";
      barcode: string;
      message: string;
    };
