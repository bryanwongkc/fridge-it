import type { Timestamp } from "firebase/firestore";

export type HouseholdLocation = "fridge" | "freezer" | "pantry" | "other";

export type HouseholdRole = "owner" | "member";

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  locations: HouseholdLocation[];
  memberCount: number;
  inviteCode?: string | null;
  inviteEnabled: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface HouseholdMember {
  userId: string;
  role: HouseholdRole;
  displayName: string | null;
  email: string | null;
  joinedAt?: Timestamp;
}

export interface CreateHouseholdInput {
  name: string;
  ownerId: string;
  ownerDisplayName: string | null;
  ownerEmail: string | null;
}
