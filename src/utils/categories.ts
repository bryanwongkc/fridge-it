import { normalizeText } from "./normalize";

export const defaultCategories = [
  "Fruits",
  "Vegetables",
  "Fresh meat",
  "Seafood",
  "Dairy",
  "Eggs",
  "Ice cream & desserts",
  "Snacks",
  "Noodles",
  "Softdrinks",
  "Alcohol",
  "Frozen food",
  "Seasoning",
];

export function mergeCategories(categories: Array<string | null | undefined>) {
  const merged = new Map<string, string>();

  [...defaultCategories, ...categories].forEach((category) => {
    const trimmed = category?.trim();
    if (!trimmed) return;
    const key = normalizeText(trimmed);
    if (!merged.has(key)) merged.set(key, trimmed);
  });

  return [...merged.values()];
}
