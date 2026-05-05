import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firestore";
import type { BarcodeCacheEntry, NormalizedProduct } from "../types/barcode";
import type { Category } from "../types/inventory";
import { normalizeDisplayName, normalizeName, suggestCategory } from "./normalizationService";

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  categories?: string;
}

interface OpenFoodFactsResponse {
  status?: number;
  code?: string;
  product?: OpenFoodFactsProduct;
}

function scoreProduct(product?: OpenFoodFactsProduct | null): "good" | "poor" {
  const name = product?.product_name || product?.generic_name || "";
  const normalized = normalizeName(name);
  const hasUsefulContext = Boolean(
    product?.brands || product?.quantity || product?.categories || product?.image_url,
  );

  if (!normalized || normalized.length < 3 || normalized === "product") {
    return "poor";
  }

  return hasUsefulContext ? "good" : "poor";
}

function normalizeProduct(barcode: string, product: OpenFoodFactsProduct): NormalizedProduct {
  const rawName = product.product_name || product.generic_name || "";
  const displayName = normalizeDisplayName(rawName);
  const category: Category = suggestCategory(displayName, product.categories);

  return {
    id: `off-${barcode}`,
    barcode,
    normalizedName: normalizeName(displayName),
    displayName,
    brand: product.brands ?? null,
    quantity: product.quantity ?? null,
    imageUrl: product.image_url ?? null,
    category,
    source: "open_food_facts",
    quality: scoreProduct(product),
  };
}

export async function lookupOpenFoodFacts(
  barcode: string,
): Promise<{ product: NormalizedProduct | null; cacheEntry: BarcodeCacheEntry }> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        barcode,
      )}.json?fields=code,product_name,generic_name,brands,quantity,image_url,categories`,
    );
    const json = (await response.json()) as OpenFoodFactsResponse;

    await setDoc(doc(collection(db, "rawOpenFoodFactsResponses")), {
      barcode,
      fetchedAt: serverTimestamp(),
      response: json,
    });

    if (!response.ok || json.status !== 1 || !json.product) {
      return {
        product: null,
        cacheEntry: {
          barcode,
          source: "open_food_facts",
          found: false,
          quality: "poor",
        },
      };
    }

    const product = normalizeProduct(barcode, json.product);
    const cacheEntry: BarcodeCacheEntry = {
      barcode,
      source: "open_food_facts",
      found: product.quality === "good",
      quality: product.quality,
      name: product.displayName,
      normalizedName: product.normalizedName,
      brand: product.brand ?? undefined,
      category: product.category,
      imageUrl: product.imageUrl ?? undefined,
      quantity: product.quantity ?? null,
      categories: json.product.categories ?? null,
    };

    await setDoc(doc(db, "normalizedProducts", product.id), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { product: product.quality === "good" ? product : null, cacheEntry };
  } catch {
    return {
      product: null,
      cacheEntry: {
        barcode,
        source: "open_food_facts",
        found: false,
        quality: "poor",
      },
    };
  }
}
