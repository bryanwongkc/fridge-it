import type { Timestamp } from "firebase/firestore";

export type ShoppingSource = "manual" | "used_up" | "low_stock" | "inventory_action";

export interface ShoppingItem {
  id: string;
  name: string;
  normalizedName: string;
  productId: string | null;
  publicProductId: string | null;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  source: ShoppingSource;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
