import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ProductInput } from "../types/product";
import type { ProductSubmission, SubmissionSource } from "../types/submission";
import { normalizeText } from "../utils/normalize";

function requireDb() {
  if (!db) throw new Error("Firebase is not configured. Add Vite Firebase env variables.");
  return db;
}

function submissionsRef() {
  return collection(requireDb(), "productSubmissions");
}

export function subscribeSubmissions(
  onNext: (submissions: ProductSubmission[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(submissionsRef(), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((item) => item.data() as ProductSubmission)),
    onError,
  );
}

export async function createOrUpdateSubmission(
  householdId: string,
  submittedBy: string | null,
  input: ProductInput,
  source: SubmissionSource,
): Promise<void> {
  const normalizedName = normalizeText(input.name);
  const byBarcode =
    input.barcode &&
    query(
      submissionsRef(),
      where("barcode", "==", input.barcode),
      where("status", "==", "pending"),
      limit(1),
    );

  const existingByBarcode = byBarcode ? await getDocs(byBarcode) : null;
  if (existingByBarcode && !existingByBarcode.empty) {
    await updateDoc(existingByBarcode.docs[0].ref, {
      submittedCount: increment(1),
      submittedHouseholdIds: arrayUnion(householdId),
    });
    return;
  }

  const byName = query(
    submissionsRef(),
    where("normalizedName", "==", normalizedName),
    where("brand", "==", input.brand || null),
    where("status", "==", "pending"),
    limit(1),
  );
  const existingByName = await getDocs(byName);
  if (!existingByName.empty) {
    await updateDoc(existingByName.docs[0].ref, {
      submittedCount: increment(1),
      submittedHouseholdIds: arrayUnion(householdId),
    });
    return;
  }

  const submissionRef = doc(submissionsRef());
  await setDoc(submissionRef, {
    id: submissionRef.id,
    householdId,
    submittedBy,
    name: input.name.trim(),
    normalizedName,
    barcode: input.barcode || null,
    brand: input.brand || null,
    category: input.category || null,
    imageUrl: input.imageUrl || null,
    defaultUnit: input.defaultUnit || null,
    defaultLocation: input.defaultLocation || "fridge",
    defaultShelfLifeDays: input.defaultShelfLifeDays ?? null,
    source,
    status: "pending",
    duplicateOfPublicProductId: null,
    submittedCount: 1,
    submittedHouseholdIds: [householdId],
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: null,
  });
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: ProductSubmission["status"],
  reviewedBy: string | null,
  fields?: Partial<Pick<ProductSubmission, "duplicateOfPublicProductId" | "adminNote">>,
): Promise<void> {
  await updateDoc(doc(submissionsRef(), submissionId), {
    status,
    reviewedAt: serverTimestamp(),
    reviewedBy,
    ...fields,
  });
}
