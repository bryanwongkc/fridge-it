import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import type { CreateHouseholdInput, Household, HouseholdMember } from "../types/household";
import type { AppUser } from "../types/user";
import { HOUSEHOLD_LOCATIONS } from "../utils/constants";

function householdFromDoc(id: string, data: Record<string, unknown>): Household {
  return {
    id,
    name: String(data.name ?? "Household"),
    ownerId: String(data.ownerId ?? ""),
    locations: HOUSEHOLD_LOCATIONS,
    memberCount: Number(data.memberCount ?? 1),
    inviteCode: typeof data.inviteCode === "string" ? data.inviteCode : null,
    inviteEnabled: Boolean(data.inviteEnabled),
    createdAt: data.createdAt as Household["createdAt"],
    updatedAt: data.updatedAt as Household["updatedAt"],
  };
}

function memberFromDoc(id: string, data: Record<string, unknown>): HouseholdMember {
  return {
    userId: String(data.userId ?? id),
    role: data.role === "owner" ? "owner" : "member",
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    email: typeof data.email === "string" ? data.email : null,
    joinedAt: data.joinedAt as HouseholdMember["joinedAt"],
  };
}

export async function ensureUserDocument(input: {
  uid: string;
  displayName: string | null;
  email: string | null;
}): Promise<void> {
  const userRef = doc(db, "users", input.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: input.uid,
      displayName: input.displayName,
      email: input.email,
      activeHouseholdId: null,
      householdIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await updateDoc(userRef, {
    displayName: input.displayName,
    email: input.email,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeUserDocument(
  uid: string,
  callback: (user: AppUser | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.data();
    callback({
      uid,
      displayName: typeof data.displayName === "string" ? data.displayName : null,
      email: typeof data.email === "string" ? data.email : null,
      activeHouseholdId:
        typeof data.activeHouseholdId === "string" ? data.activeHouseholdId : null,
      householdIds: Array.isArray(data.householdIds) ? data.householdIds : [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });
}

export function subscribeUserHouseholds(
  householdIds: string[],
  callback: (households: Household[]) => void,
): Unsubscribe {
  if (householdIds.length === 0) {
    callback([]);
    return () => undefined;
  }

  const householdQuery = query(
    collection(db, "households"),
    where(documentId(), "in", householdIds.slice(0, 30)),
  );

  return onSnapshot(householdQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((householdDoc) => householdFromDoc(householdDoc.id, householdDoc.data()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  });
}

export async function createHousehold(input: CreateHouseholdInput): Promise<string> {
  const householdRef = doc(collection(db, "households"));
  const memberRef = doc(db, "households", householdRef.id, "members", input.ownerId);
  const userRef = doc(db, "users", input.ownerId);
  const batch = writeBatch(db);

  batch.set(householdRef, {
    name: input.name.trim(),
    ownerId: input.ownerId,
    locations: HOUSEHOLD_LOCATIONS,
    memberCount: 1,
    inviteCode: null,
    inviteEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(memberRef, {
    userId: input.ownerId,
    role: "owner",
    displayName: input.ownerDisplayName,
    email: input.ownerEmail,
    joinedAt: serverTimestamp(),
  });
  batch.update(userRef, {
    activeHouseholdId: householdRef.id,
    householdIds: arrayUnion(householdRef.id),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return householdRef.id;
}

export async function switchActiveHousehold(uid: string, householdId: string): Promise<void> {
  const memberSnap = await getDoc(doc(db, "households", householdId, "members", uid));
  if (!memberSnap.exists()) {
    throw new Error("You are not a member of this household.");
  }

  await updateDoc(doc(db, "users", uid), {
    activeHouseholdId: householdId,
    updatedAt: serverTimestamp(),
  });
}

export async function renameHousehold(householdId: string, name: string): Promise<void> {
  await updateDoc(doc(db, "households", householdId), {
    name: name.trim(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeHouseholdMembers(
  householdId: string,
  callback: (members: HouseholdMember[]) => void,
): Unsubscribe {
  const membersQuery = query(
    collection(db, "households", householdId, "members"),
    orderBy("joinedAt", "asc"),
  );

  return onSnapshot(membersQuery, (snapshot) => {
    callback(snapshot.docs.map((memberDoc) => memberFromDoc(memberDoc.id, memberDoc.data())));
  });
}

export async function leaveHousehold(uid: string, household: Household): Promise<void> {
  if (household.ownerId === uid) {
    throw new Error("The owner cannot leave the household in this MVP.");
  }

  const batch = writeBatch(db);
  batch.delete(doc(db, "households", household.id, "members", uid));
  batch.update(doc(db, "households", household.id), {
    memberCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "users", uid), {
    activeHouseholdId: null,
    householdIds: arrayRemove(household.id),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function removeMember(
  householdId: string,
  memberUserId: string,
): Promise<void> {
  await deleteDoc(doc(db, "households", householdId, "members", memberUserId));
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snapshot = await getDoc(doc(db, "households", householdId));
  return snapshot.exists() ? householdFromDoc(snapshot.id, snapshot.data()) : null;
}

export async function findHouseholdByInviteCode(inviteCode: string): Promise<Household | null> {
  const inviteQuery = query(
    collection(db, "households"),
    where("inviteCode", "==", inviteCode),
    where("inviteEnabled", "==", true),
  );
  const snapshot = await getDocs(inviteQuery);
  const householdDoc = snapshot.docs[0];
  return householdDoc ? householdFromDoc(householdDoc.id, householdDoc.data()) : null;
}
