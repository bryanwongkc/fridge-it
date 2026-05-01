import type { Timestamp } from "firebase/firestore";
import type { ProductLocation } from "./product";

export type SubmissionSource = "manual" | "manual_after_scan" | "open_food_facts";
export type SubmissionStatus = "pending" | "approved" | "rejected" | "merged";

export interface ProductSubmission {
  id: string;
  householdId: string;
  submittedBy: string | null;
  name: string;
  normalizedName: string;
  barcode: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  defaultUnit: string | null;
  defaultLocation: ProductLocation;
  defaultShelfLifeDays: number | null;
  source: SubmissionSource;
  status: SubmissionStatus;
  duplicateOfPublicProductId: string | null;
  submittedCount: number;
  submittedHouseholdIds: string[];
  createdAt: Timestamp;
  reviewedAt: Timestamp | null;
  reviewedBy: string | null;
  adminNote: string | null;
}
