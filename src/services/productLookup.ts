import type { HouseholdProduct, ProductDraft, ProductInput, PublicProduct } from "../types/product";
import { normalizeText } from "../utils/normalize";
import { lookupOpenFoodFacts } from "./openFoodFacts";
import {
  createPersonalProduct,
  createPersonalProductFromOpenFoodFacts,
  createPersonalProductFromPublic,
  findPersonalProductByBarcode,
  findPublicProductByBarcode,
} from "./productsService";
import { createOrUpdateSubmission } from "./submissionsService";

export type BarcodeLookupResult =
  | { source: "personal"; product: HouseholdProduct }
  | { source: "public"; product: HouseholdProduct }
  | { source: "open_food_facts"; productDraft: ProductDraft }
  | { source: "not_found"; barcode: string };

export interface SearchProductsResult {
  personal: HouseholdProduct[];
  publicProducts: PublicProduct[];
}

export async function lookupByBarcode(
  householdId: string,
  barcode: string,
  userId: string | null,
): Promise<BarcodeLookupResult> {
  const personal = await findPersonalProductByBarcode(householdId, barcode);
  if (personal) return { source: "personal", product: personal };

  const publicProduct = await findPublicProductByBarcode(barcode);
  if (publicProduct) {
    const product = await createPersonalProductFromPublic(householdId, publicProduct, userId);
    return { source: "public", product };
  }

  const productDraft = await lookupOpenFoodFacts(barcode);
  if (productDraft) return { source: "open_food_facts", productDraft };

  return { source: "not_found", barcode };
}

export function searchProducts(
  personalProducts: HouseholdProduct[],
  publicProducts: PublicProduct[],
  query: string,
): SearchProductsResult {
  const normalized = normalizeText(query);
  if (!normalized) return { personal: [], publicProducts: [] };

  const matches = (value: string) => normalizeText(value).includes(normalized);
  return {
    personal: personalProducts
      .filter((product) => matches(product.name) || product.normalizedName.includes(normalized))
      .slice(0, 8),
    publicProducts: publicProducts
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
  if (input.barcode) {
    const publicProduct = await findPublicProductByBarcode(input.barcode);
    if (publicProduct) {
      return createPersonalProductFromPublic(householdId, publicProduct, userId);
    }
  }

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

export async function createPersonalProductFromOffDraft(
  householdId: string,
  input: ProductInput,
  userId: string | null,
): Promise<HouseholdProduct> {
  const product = await createPersonalProductFromOpenFoodFacts(householdId, input, userId);
  await createOrUpdateSubmission(householdId, userId, input, "open_food_facts");
  return product;
}
