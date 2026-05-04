import type { Timestamp } from "firebase/firestore";
import type { ProductLocation } from "./product";

export type InventoryStatus = "active" | "used" | "expired" | "discarded";

export interface InventoryItem {
  id: string;
  productId: string | null;
  publicProductId: string | null;
  name: string;
  normalizedName: string;
  barcode: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
  unit: string;
  location: ProductLocation;
  remainingPercent?: number | null;
  expiryDate: string | null;
  hasNoExpiry: boolean;
  addedAt: Timestamp;
  updatedAt: Timestamp;
  status: InventoryStatus;
  notes: string | null;
}

export interface InventoryInput {
  productId: string | null;
  publicProductId: string | null;
  name: string;
  barcode: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
  unit: string;
  location: ProductLocation;
  remainingPercent?: number | null;
  expiryDate: string | null;
  hasNoExpiry: boolean;
  notes: string | null;
}
