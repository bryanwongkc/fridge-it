import type { HouseholdProduct, ProductInput } from "../types/product";
import { normalizeText } from "../utils/normalize";
import {
  createPersonalProduct,
  findPersonalProductByBarcode,
} from "./productsService";
import { createOrUpdateSubmission } from "./submissionsService";

export type BarcodeLookupResult =
  | { source: "personal"; product: HouseholdProduct }
  | { source: "not_found"; barcode: string };

export interface SearchProductsResult {
  personal: HouseholdProduct[];
}

export async function lookupByBarcode(
  householdId: string,
  barcode: string,
): Promise<BarcodeLookupResult> {
  const personal = await findPersonalProductByBarcode(householdId, barcode);
  if (personal) return { source: "personal", product: personal };

  return { source: "not_found", barcode };
}

export function searchProducts(
  personalProducts: HouseholdProduct[],
  query: string,
): SearchProductsResult {
  const normalized = normalizeText(query);
  if (!normalized) return { personal: [] };

  const matches = (value: string) => normalizeText(value).includes(normalized);
  return {
    personal: personalProducts
      .filter((product) => matches(product.name) || product.normalizedName.includes(normalized))
      .slice(0, 8),
  };
}

export async function createManualPersonalProduct(
  householdId: string,
  input: ProductInput,
  userId: string | null,
  source: "manual" | "manual_after_scan",
): Promise<HouseholdProduct> {
  const product = await createPersonalProduct(
    householdId,
    input,
    source,
    source === "manual_after_scan" ? "external" : "household",
    null,
    userId,
  );
  await createOrUpdateSubmission(householdId, userId, input, source);
  return product;
}
