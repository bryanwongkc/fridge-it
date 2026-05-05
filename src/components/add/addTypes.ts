import type { HouseholdLocation } from "../../types/household";
import type {
  Category,
  ExpiryPreset,
  PercentageValue,
  QuantityMode,
  Unit,
} from "../../types/inventory";

export interface QuickAddDraft {
  name: string;
  location: HouseholdLocation;
  category: Category;
  quantityMode: QuantityMode;
  percentage: PercentageValue;
  quantity: number;
  unit: Unit;
  expiryPreset: ExpiryPreset;
  customExpiryDate: string;
  barcode: string;
  desiredStockEnabled: boolean;
  desiredMinQuantity: number;
  desiredMinPercentage: number;
}

export type SaveIntent = "save" | "addAnother";
