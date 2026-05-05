import type { Category, QuantityMode } from "../types/inventory";
import { compactWhitespace, titleCase } from "../utils/stringUtils";

const CATEGORY_KEYWORDS: Array<{ category: Category; keywords: string[] }> = [
  { category: "Dairy", keywords: ["milk", "cheese", "yogurt", "cream", "butter"] },
  { category: "Eggs", keywords: ["egg", "eggs"] },
  { category: "Meat", keywords: ["beef", "pork", "chicken", "ham", "sausage"] },
  { category: "Seafood", keywords: ["fish", "salmon", "tuna", "shrimp", "prawn"] },
  { category: "Vegetables", keywords: ["lettuce", "carrot", "broccoli", "onion", "tomato"] },
  { category: "Fruit", keywords: ["apple", "orange", "banana", "berry", "grape", "fruit"] },
  { category: "Drinks", keywords: ["drink", "drinks", "juice", "water", "soda", "tea", "coffee"] },
  { category: "Frozen", keywords: ["frozen", "ice cream", "dumpling"] },
  { category: "Condiments", keywords: ["sauce", "ketchup", "mustard", "mayo", "soy sauce"] },
  { category: "Snacks", keywords: ["chips", "cookies", "crackers", "snack"] },
  { category: "Pantry", keywords: ["rice", "pasta", "noodle", "flour", "cereal", "beans"] },
  { category: "Leftovers", keywords: ["leftover", "meal prep"] },
];

const COUNT_KEYWORDS = [
  "egg",
  "eggs",
  "apple",
  "orange",
  "banana",
  "can",
  "bottle",
  "pack",
  "carton",
  "box",
  "pcs",
  "piece",
];

export function normalizeName(value: string): string {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeDisplayName(value: string): string {
  return titleCase(value);
}

export function suggestCategory(name: string, externalCategory?: string | null): Category {
  const external = normalizeDisplayName(externalCategory ?? "");
  if (CATEGORY_KEYWORDS.some(({ category }) => category === external)) {
    return external as Category;
  }

  const normalized = normalizeName(name);
  return (
    CATEGORY_KEYWORDS.find(({ keywords }) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.category ?? "Other"
  );
}

export function suggestQuantityMode(name: string, category?: Category): QuantityMode {
  const normalized = normalizeName(name);
  if (category === "Eggs" || category === "Fruit") {
    return "count";
  }
  if (category === "Drinks") {
    return COUNT_KEYWORDS.some((keyword) => normalized.includes(keyword)) ? "count" : "percentage";
  }
  return COUNT_KEYWORDS.some((keyword) => normalized.includes(keyword)) ? "count" : "percentage";
}
