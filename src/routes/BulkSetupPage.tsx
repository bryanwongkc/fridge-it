import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Save, Trash2 } from "lucide-react";
import { ExpiryPresetChips } from "../components/add/ExpiryPresetChips";
import { QuantityControl } from "../components/add/QuantityControl";
import { useHouseholdLibrary } from "../hooks/useHouseholdLibrary";
import { useInventory } from "../hooks/useInventory";
import type { HouseholdLocation } from "../types/household";
import type { Category, ExpiryPreset, PercentageValue, QuantityMode, Unit } from "../types/inventory";
import {
  HOUSEHOLD_LOCATIONS,
  LOCATION_LABELS,
} from "../utils/constants";
import {
  expiryPresetToDate,
  expiryPresetToDays,
  todayDateString,
} from "../utils/dateUtils";
import {
  normalizeDisplayName,
  suggestCategory,
  suggestQuantityMode,
} from "../services/normalizationService";

interface BulkDraftItem {
  id: string;
  name: string;
  location: HouseholdLocation;
  category: Category;
  expiryPreset: ExpiryPreset;
  customExpiryDate: string;
  quantityMode: QuantityMode;
  percentage: PercentageValue;
  quantity: number;
  unit: Unit;
}

const starterItems = [
  "Eggs",
  "Milk",
  "Yogurt",
  "Cheese",
  "Vegetables",
  "Fruit",
  "Meat",
  "Fish",
  "Bread",
  "Rice",
  "Pasta",
  "Dumplings",
  "Frozen food",
  "Sauce",
  "Drinks",
  "Snacks",
  "Leftovers",
];

function createDraft(name: string): BulkDraftItem {
  const displayName = normalizeDisplayName(name);
  const category = suggestCategory(displayName);
  const quantityMode = suggestQuantityMode(displayName, category);

  return {
    id: crypto.randomUUID(),
    name: displayName,
    location: category === "Frozen" ? "freezer" : category === "Pantry" ? "pantry" : "fridge",
    category,
    expiryPreset: "unknown",
    customExpiryDate: todayDateString(),
    quantityMode,
    percentage: 100,
    quantity: 1,
    unit: quantityMode === "count" ? "pcs" : "item",
  };
}

export function BulkSetupPage() {
  const navigate = useNavigate();
  const { createItem } = useInventory();
  const { upsertFromInventoryItem } = useHouseholdLibrary();
  const [items, setItems] = useState<BulkDraftItem[]>([]);
  const [customName, setCustomName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNames = useMemo(
    () => new Set(items.map((item) => item.name.toLowerCase())),
    [items],
  );

  function addStarter(name: string) {
    const displayName = normalizeDisplayName(name);
    if (selectedNames.has(displayName.toLowerCase())) {
      return;
    }
    setItems((current) => [...current, createDraft(displayName)]);
  }

  function updateItem(id: string, patch: Partial<BulkDraftItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addCustom() {
    if (!customName.trim()) {
      return;
    }
    addStarter(customName);
    setCustomName("");
  }

  async function saveBatch() {
    setBusy(true);
    setError(null);
    try {
      for (const item of items) {
        const expiryDate =
          item.expiryPreset === "custom"
            ? item.customExpiryDate
            : expiryPresetToDate(item.expiryPreset);
        const template = await upsertFromInventoryItem({
          name: item.name,
          displayName: item.name,
          category: item.category,
          defaultLocation: item.location,
          quantityMode: item.quantityMode,
          defaultQuantity: item.quantityMode === "count" ? item.quantity : undefined,
          defaultUnit: item.quantityMode === "count" ? item.unit : undefined,
          defaultPercentageRemaining:
            item.quantityMode === "percentage" ? item.percentage : undefined,
          expiryPreset: item.expiryPreset,
          defaultExpiryDays: expiryPresetToDays(item.expiryPreset),
        });
        await createItem({
          templateId: template.id,
          name: item.name,
          location: item.location,
          category: item.category,
          expiryKnown: item.expiryPreset !== "unknown",
          expiryPreset: item.expiryPreset,
          expiryDate,
          quantityMode: item.quantityMode,
          percentage: item.quantityMode === "percentage" ? item.percentage : undefined,
          quantity: item.quantityMode === "count" ? item.quantity : undefined,
          unit: item.quantityMode === "count" ? item.unit : undefined,
        });
      }
      navigate("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save batch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-moss">Bulk setup</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Add what's already at home</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Skip anything you're not sure about. You can fix details later.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">Tap common foods</h2>
        <div className="flex flex-wrap gap-2">
          {starterItems.map((name) => {
            const selected = selectedNames.has(name.toLowerCase());
            return (
              <button
                key={name}
                type="button"
                onClick={() => addStarter(name)}
                className={[
                  "tap-target rounded-full px-4 text-sm font-semibold",
                  selected
                    ? "bg-sage text-moss"
                    : "bg-white text-stone-700 ring-1 ring-stone-200",
                ].join(" ")}
              >
                {name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft">
        <h2 className="text-base font-bold text-ink">Add custom item</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="Something else"
            aria-label="Custom item name"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
          />
          <button
            type="button"
            onClick={addCustom}
            className="tap-target inline-flex items-center justify-center rounded-2xl bg-ink px-4 text-white"
            aria-label="Add custom item"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </section>

      {items.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Batch list</h2>
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <input
                  value={item.name}
                  onChange={(event) => {
                    const name = normalizeDisplayName(event.target.value);
                    const category = suggestCategory(name);
                    updateItem(item.id, {
                      name,
                      category,
                      quantityMode: suggestQuantityMode(name, category),
                    });
                  }}
                  aria-label={`${item.name} name`}
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base font-semibold outline-none focus:border-moss focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {HOUSEHOLD_LOCATIONS.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => updateItem(item.id, { location })}
                    className={[
                      "tap-target rounded-full px-4 text-sm font-semibold",
                      item.location === location
                        ? "bg-moss text-white"
                        : "bg-white text-stone-600 ring-1 ring-stone-200",
                    ].join(" ")}
                  >
                    {LOCATION_LABELS[location]}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-stone-700">Expiry</p>
                <ExpiryPresetChips
                  value={item.expiryPreset}
                  onChange={(expiryPreset) => updateItem(item.id, { expiryPreset })}
                />
                {item.expiryPreset === "custom" ? (
                  <input
                    type="date"
                    value={item.customExpiryDate}
                    onChange={(event) =>
                      updateItem(item.id, { customExpiryDate: event.target.value })
                    }
                    className="mt-3 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
                  />
                ) : null}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-stone-700">Rough quantity</p>
                <QuantityControl
                  mode={item.quantityMode}
                  percentage={item.percentage}
                  quantity={item.quantity}
                  unit={item.unit}
                  onModeChange={(quantityMode) => updateItem(item.id, { quantityMode })}
                  onPercentageChange={(percentage) => updateItem(item.id, { percentage })}
                  onQuantityChange={(quantity) => updateItem(item.id, { quantity })}
                  onUnitChange={(unit) => updateItem(item.id, { unit })}
                />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Start with a few items</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Tap the foods you have. Details can stay rough.
          </p>
        </section>
      )}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="sticky bottom-28 grid gap-2 rounded-[1.25rem] bg-cream/90 py-2 backdrop-blur sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void saveBatch()}
          disabled={busy || items.length === 0}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save batch
        </button>
        <Link
          to="/dashboard"
          className="tap-target inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
