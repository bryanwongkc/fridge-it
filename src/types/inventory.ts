import type { Timestamp } from "firebase/firestore";
import type { HouseholdLocation } from "./household";

export type QuantityMode = "percentage" | "count";

export type InventoryStatus =
  | "available"
  | "consumed"
  | "discarded"
  | "expired"
  | "kept"
  | "deleted";

export type ExpiryPreset =
  | "today"
  | "tomorrow"
  | "3_days"
  | "1_week"
  | "2_weeks"
  | "1_month"
  | "3_months"
  | "unknown"
  | "custom";

export type Category =
  | "Dairy"
  | "Meat"
  | "Seafood"
  | "Vegetables"
  | "Fruit"
  | "Drinks"
  | "Eggs"
  | "Leftovers"
  | "Frozen"
  | "Condiments"
  | "Snacks"
  | "Pantry"
  | "Other";

export type Unit =
  | "pcs"
  | "pack"
  | "bottle"
  | "carton"
  | "box"
  | "bag"
  | "tray"
  | "can"
  | "g"
  | "kg"
  | "ml"
  | "L"
  | "item";

export interface InventoryItem {
  id: string;
  householdId: string;
  templateId?: string | null;
  barcode?: string | null;
  name: string;
  normalizedName: string;
  category: Category;
  location: HouseholdLocation;
  quantityMode?: QuantityMode;
  percentage?: 100 | 75 | 50 | 25 | 10 | 0;
  quantity?: number;
  unit?: Unit;
  expiryKnown: boolean;
  expiryDate?: string | null;
  expiryPreset?: ExpiryPreset;
  status: InventoryStatus;
  addedBy: string;
  updatedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  consumedAt?: Timestamp | null;
  discardedAt?: Timestamp | null;
  keptAt?: Timestamp | null;
  deletedAt?: Timestamp | null;
}

export type ExpiryStatus = "unknown" | "fresh" | "expiringSoon" | "expired";

export type PercentageValue = 100 | 75 | 50 | 25 | 10 | 0;

export interface CreateInventoryItemInput {
  householdId: string;
  userId: string;
  name: string;
  location: HouseholdLocation;
  category?: Category;
  barcode?: string | null;
  templateId?: string | null;
  quantityMode?: QuantityMode;
  percentage?: PercentageValue;
  quantity?: number;
  unit?: Unit;
  expiryKnown?: boolean;
  expiryDate?: string | null;
  expiryPreset?: ExpiryPreset;
}

export interface UpdateInventoryItemInput {
  name?: string;
  location?: HouseholdLocation;
  category?: Category;
  barcode?: string | null;
  quantityMode?: QuantityMode;
  percentage?: PercentageValue | null;
  quantity?: number | null;
  unit?: Unit | null;
  expiryKnown?: boolean;
  expiryDate?: string | null;
  expiryPreset?: ExpiryPreset;
  status?: InventoryStatus;
  updatedBy: string;
}
