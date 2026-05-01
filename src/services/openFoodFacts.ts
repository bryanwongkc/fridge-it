import type { ProductDraft } from "../types/product";

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  categories?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export async function lookupOpenFoodFacts(barcode: string): Promise<ProductDraft | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
  );

  if (!response.ok) {
    throw new Error("Open Food Facts lookup failed.");
  }

  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) return null;

  const product = data.product;
  const name = product.product_name || product.product_name_en;
  if (!name) return null;

  return {
    name,
    barcode,
    brand: product.brands || null,
    imageUrl: product.image_url || null,
    category: product.categories || null,
    defaultUnit: product.quantity || null,
    defaultLocation: "fridge",
    defaultShelfLifeDays: null,
    source: "open_food_facts",
  };
}
