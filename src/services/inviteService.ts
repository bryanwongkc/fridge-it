import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import type { Household } from "../types/household";
import { findHouseholdByInviteCode } from "./householdService";

function createInviteCode(): string {
  const randomPart = crypto.getRandomValues(new Uint32Array(2));
  return Array.from(randomPart, (value) => value.toString(36)).join("").slice(0, 12);
}

export async function generateInviteCode(householdId: string): Promise<string> {
  const inviteCode = createInviteCode();
  await updateDoc(doc(db, "households", householdId), {
    inviteCode,
    inviteEnabled: true,
    updatedAt: serverTimestamp(),
  });
  return inviteCode;
}

export async function setInviteEnabled(
  householdId: string,
  inviteEnabled: boolean,
): Promise<void> {
  await updateDoc(doc(db, "households", householdId), {
    inviteEnabled,
    updatedAt: serverTimestamp(),
  });
}

export async function resolveInvite(inviteCode: string): Promise<Household | null> {
  return findHouseholdByInviteCode(inviteCode);
}

export async function joinHouseholdByInvite(input: {
  inviteCode: string;
  uid: string;
  displayName: string | null;
  email: string | null;
}): Promise<{ householdId: string; alreadyMember: boolean }> {
  const household = await resolveInvite(input.inviteCode);
  if (!household) {
    throw new Error("This invite link is invalid or has been disabled.");
  }

  const memberRef = doc(db, "households", household.id, "members", input.uid);
  const memberSnap = await getDoc(memberRef);
  const alreadyMember = memberSnap.exists();

  const batch = writeBatch(db);
  if (!alreadyMember) {
    batch.set(memberRef, {
      userId: input.uid,
      role: "member",
      displayName: input.displayName,
      email: input.email,
      joinedAt: serverTimestamp(),
    });
    batch.update(doc(db, "households", household.id), {
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(doc(db, "users", input.uid), {
    activeHouseholdId: household.id,
    householdIds: arrayUnion(household.id),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return { householdId: household.id, alreadyMember };
}
