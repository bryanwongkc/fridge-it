import type { Timestamp } from "firebase/firestore";

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  activeHouseholdId: string | null;
  householdIds: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
