import type { Timestamp } from "firebase/firestore";
import type { HouseholdLocation } from "./household";
import type { Category, ExpiryPreset, PercentageValue, QuantityMode, Unit } from "./inventory";

export interface DesiredStockRule {
  enabled: boolean;
  quantityMode: QuantityMode;
  desiredPercentage?: number;
  desiredQuantity?: number;
  unit?: Unit;
}

export interface HouseholdItemTemplate {
  id: string;
  householdId: string;
  name: string;
  displayName: string;
  normalizedName: string;
  category: Category;
  defaultLocation: HouseholdLocation;
  quantityMode?: QuantityMode;
  defaultQuantityMode?: QuantityMode;
  defaultQuantity?: number;
  defaultUnit?: Unit;
  defaultPercentageRemaining?: PercentageValue;
  defaultPercentage?: PercentageValue;
  expiryPreset?: ExpiryPreset;
  defaultExpiryPreset?: ExpiryPreset;
  defaultExpiryDays?: number | null;
  desiredStockEnabled: boolean;
  desiredMinQuantity?: number | null;
  desiredMinPercentage?: number | null;
  desiredStock?: DesiredStockRule;
  barcodes: string[];
  favorite: boolean;
  useCount: number;
  usageCount: number;
  lastUsedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TemplateDefaultsInput {
  householdId: string;
  name: string;
  displayName?: string;
  normalizedName?: string;
  category: Category;
  defaultLocation: HouseholdLocation;
  quantityMode?: QuantityMode;
  defaultQuantity?: number;
  defaultUnit?: Unit;
  defaultPercentageRemaining?: PercentageValue;
  expiryPreset?: ExpiryPreset;
  defaultExpiryDays?: number | null;
  desiredStockEnabled?: boolean;
  desiredMinQuantity?: number | null;
  desiredMinPercentage?: number | null;
  barcodes?: string[];
  favorite?: boolean;
}

export interface UpdateTemplateInput {
  displayName?: string;
  category?: Category;
  defaultLocation?: HouseholdLocation;
  quantityMode?: QuantityMode;
  defaultQuantity?: number | null;
  defaultUnit?: Unit | null;
  defaultPercentageRemaining?: PercentageValue | null;
  expiryPreset?: ExpiryPreset;
  defaultExpiryDays?: number | null;
  desiredStockEnabled?: boolean;
  desiredMinQuantity?: number | null;
  desiredMinPercentage?: number | null;
  barcodes?: string[];
  favorite?: boolean;
}
