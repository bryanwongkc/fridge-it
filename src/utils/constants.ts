import type { HouseholdLocation } from "../types/household";
import type { Category, PercentageValue, Unit } from "../types/inventory";

export const APP_NAME = "Fridge Memory";

export const APP_TAGLINE =
  "A faster way to remember what's in your fridge, freezer, and pantry.";

export const HOUSEHOLD_LOCATIONS: HouseholdLocation[] = [
  "fridge",
  "freezer",
  "pantry",
  "other",
];

export const LOCATION_LABELS: Record<HouseholdLocation, string> = {
  fridge: "Fridge",
  freezer: "Freezer",
  pantry: "Pantry",
  other: "Other",
};

export const CATEGORY_LABELS: Category[] = [
  "Dairy",
  "Meat",
  "Seafood",
  "Vegetables",
  "Fruit",
  "Drinks",
  "Eggs",
  "Leftovers",
  "Frozen",
  "Condiments",
  "Snacks",
  "Pantry",
  "Other",
];

export const UNIT_OPTIONS: Unit[] = [
  "pcs",
  "pack",
  "bottle",
  "carton",
  "box",
  "bag",
  "tray",
  "can",
  "g",
  "kg",
  "ml",
  "L",
  "item",
];

export const PERCENTAGE_OPTIONS: Array<{ value: PercentageValue; label: string }> = [
  { value: 100, label: "Full" },
  { value: 75, label: "75%" },
  { value: 50, label: "Half" },
  { value: 25, label: "25%" },
  { value: 10, label: "Almost finished" },
  { value: 0, label: "Empty" },
];
