import type { Timestamp } from "firebase/firestore";
import type { Unit } from "./inventory";

export interface GroceryListItem {
  id: string;
  householdId: string;
  templateId?: string | null;
  name: string;
  normalizedName: string;
  quantity?: number;
  unit?: Unit;
  checked: boolean;
  source: "manual" | "buy_soon";
  reason?: string | null;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  checkedAt?: Timestamp | null;
}

export interface AddGroceryItemInput {
  householdId: string;
  userId: string;
  templateId?: string | null;
  name: string;
  quantity?: number;
  unit?: Unit;
  source: "manual" | "buy_soon";
  reason?: string | null;
}
