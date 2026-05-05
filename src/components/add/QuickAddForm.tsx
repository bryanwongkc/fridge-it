import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Barcode, ChevronDown, Save } from "lucide-react";
import type { HouseholdItemTemplate } from "../../types/library";
import type { Category, PercentageValue, QuantityMode, Unit } from "../../types/inventory";
import {
  CATEGORY_LABELS,
  HOUSEHOLD_LOCATIONS,
  LOCATION_LABELS,
} from "../../utils/constants";
import { todayDateString } from "../../utils/dateUtils";
import { normalizeDisplayName, suggestCategory, suggestQuantityMode } from "../../services/normalizationService";
import { ExpiryPresetChips } from "./ExpiryPresetChips";
import { QuantityControl } from "./QuantityControl";
import type { QuickAddDraft, SaveIntent } from "./addTypes";

export interface QuickAddFormHandle {
  reset: (template?: HouseholdItemTemplate | null) => void;
  focusName: () => void;
  applyBarcode: (input: {
    barcode: string;
    name?: string;
    category?: Category;
    location?: QuickAddDraft["location"];
  }) => void;
}

interface QuickAddFormProps {
  selectedTemplate: HouseholdItemTemplate | null;
  busy: boolean;
  onSave: (draft: QuickAddDraft, intent: SaveIntent) => Promise<void>;
}

function draftFromTemplate(template?: HouseholdItemTemplate | null): QuickAddDraft {
  if (!template) {
    return {
      name: "",
      location: "fridge",
      category: "Other",
      quantityMode: "percentage",
      percentage: 100,
      quantity: 1,
      unit: "pcs",
      expiryPreset: "unknown",
      customExpiryDate: todayDateString(),
      barcode: "",
      desiredStockEnabled: false,
      desiredMinQuantity: 1,
      desiredMinPercentage: 25,
    };
  }

  const quantityMode = template.quantityMode ?? template.defaultQuantityMode ?? "percentage";
  return {
    name: template.displayName,
    location: template.defaultLocation,
    category: template.category,
    quantityMode,
    percentage: (template.defaultPercentageRemaining ?? template.defaultPercentage ?? 100) as PercentageValue,
    quantity: template.defaultQuantity ?? 1,
    unit: template.defaultUnit ?? "pcs",
    expiryPreset: template.expiryPreset ?? template.defaultExpiryPreset ?? "unknown",
    customExpiryDate: todayDateString(),
    barcode: template.barcodes[0] ?? "",
    desiredStockEnabled: template.desiredStockEnabled,
    desiredMinQuantity: template.desiredMinQuantity ?? 1,
    desiredMinPercentage: template.desiredMinPercentage ?? 25,
  };
}

export const QuickAddForm = forwardRef<QuickAddFormHandle, QuickAddFormProps>(
  ({ selectedTemplate, busy, onSave }, ref) => {
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    const [draft, setDraft] = useState<QuickAddDraft>(() => draftFromTemplate(selectedTemplate));
    const [categoryTouched, setCategoryTouched] = useState(false);
    const [quantityModeTouched, setQuantityModeTouched] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    useEffect(() => {
      if (selectedTemplate) {
        setDraft(draftFromTemplate(selectedTemplate));
        setCategoryTouched(true);
        setQuantityModeTouched(true);
      }
    }, [selectedTemplate]);

    useImperativeHandle(ref, () => ({
      reset: (template?: HouseholdItemTemplate | null) => {
        setDraft(draftFromTemplate(template));
        setCategoryTouched(Boolean(template));
        setQuantityModeTouched(Boolean(template));
        setAdvancedOpen(false);
        window.setTimeout(() => nameInputRef.current?.focus(), 0);
      },
      focusName: () => nameInputRef.current?.focus(),
      applyBarcode: (input) => {
        setDraft((current) => {
          const nextName = input.name || current.name;
          const nextCategory = input.category ?? (nextName ? suggestCategory(nextName) : current.category);
          return {
            ...current,
            barcode: input.barcode,
            name: nextName,
            category: nextCategory,
            location: input.location ?? current.location,
            quantityMode: quantityModeTouched
              ? current.quantityMode
              : suggestQuantityMode(nextName, nextCategory),
          };
        });
        window.setTimeout(() => nameInputRef.current?.focus(), 0);
      },
    }));

    const displayName = useMemo(() => normalizeDisplayName(draft.name), [draft.name]);

    function updateName(value: string) {
      const suggestedCategory = suggestCategory(value);
      setDraft((current) => {
        const nextCategory = categoryTouched ? current.category : suggestedCategory;
        return {
          ...current,
          name: value,
          category: nextCategory,
          quantityMode: quantityModeTouched
            ? current.quantityMode
            : suggestQuantityMode(value, nextCategory),
        };
      });
    }

    async function handleSubmit(intent: SaveIntent) {
      await onSave(
        {
          ...draft,
          name: displayName || draft.name.trim(),
          barcode: draft.barcode.trim(),
        },
        intent,
      );
    }

    return (
      <section className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-soft">
        <div>
          <h2 className="text-lg font-bold text-ink">Manual quick add</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Name and location are enough. Everything else can be skipped.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Name</span>
            <input
              ref={nameInputRef}
              value={draft.name}
              onChange={(event) => updateName(event.target.value)}
              placeholder="Milk, eggs, apples"
              required
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-stone-700">Location</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {HOUSEHOLD_LOCATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, location: option }))}
                  className={[
                    "tap-target rounded-full px-4 text-sm font-semibold",
                    option === draft.location
                      ? "bg-moss text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200",
                  ].join(" ")}
                >
                  {LOCATION_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-700">Category</p>
              <span className="text-xs font-semibold text-stone-400">Optional</span>
            </div>
            <select
              value={draft.category}
              onChange={(event) => {
                setCategoryTouched(true);
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as Category,
                }));
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            >
              {CATEGORY_LABELS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-700">Expiry</p>
            <div className="mt-2">
              <ExpiryPresetChips
                value={draft.expiryPreset}
                onChange={(expiryPreset) => setDraft((current) => ({ ...current, expiryPreset }))}
              />
            </div>
            {draft.expiryPreset === "custom" ? (
              <input
                type="date"
                value={draft.customExpiryDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, customExpiryDate: event.target.value }))
                }
                className="mt-3 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
              />
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-700">Quantity</p>
            <div className="mt-2">
              <QuantityControl
                mode={draft.quantityMode}
                percentage={draft.percentage}
                quantity={draft.quantity}
                unit={draft.unit}
                onModeChange={(quantityMode: QuantityMode) => {
                  setQuantityModeTouched(true);
                  setDraft((current) => ({ ...current, quantityMode }));
                }}
                onPercentageChange={(percentage: PercentageValue) =>
                  setDraft((current) => ({ ...current, percentage }))
                }
                onQuantityChange={(quantity: number) =>
                  setDraft((current) => ({ ...current, quantity }))
                }
                onUnitChange={(unit: Unit) => setDraft((current) => ({ ...current, unit }))}
              />
            </div>
          </div>

          <label className="block">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
              <Barcode className="h-4 w-4" />
              Attached barcode
            </span>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              Optional. Scan above or type the number so this household can reuse it.
            </p>
            <input
              value={draft.barcode}
              onChange={(event) => setDraft((current) => ({ ...current, barcode: event.target.value }))}
              placeholder="Optional barcode number"
              aria-label="Optional barcode number"
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            />
          </label>

          <button
            type="button"
            onClick={() => setAdvancedOpen((value) => !value)}
            className="tap-target inline-flex w-full items-center justify-between rounded-2xl bg-stone-100 px-4 text-sm font-semibold text-ink"
          >
            Remember desired stock
            <ChevronDown className={`h-4 w-4 transition ${advancedOpen ? "rotate-180" : ""}`} />
          </button>

          {advancedOpen ? (
            <div className="rounded-2xl bg-stone-50 p-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={draft.desiredStockEnabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      desiredStockEnabled: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-moss"
                />
                Track low stock for this item
              </label>
              {draft.desiredStockEnabled ? (
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-stone-700">
                    {draft.quantityMode === "count" ? "Minimum count" : "Minimum percentage"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={
                      draft.quantityMode === "count"
                        ? draft.desiredMinQuantity
                        : draft.desiredMinPercentage
                    }
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setDraft((current) =>
                        current.quantityMode === "count"
                          ? { ...current, desiredMinQuantity: value }
                          : { ...current, desiredMinPercentage: value },
                      );
                    }}
                    className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base outline-none focus:border-moss"
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-28 mt-5 grid gap-2 rounded-[1.25rem] bg-white/90 py-2 backdrop-blur sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleSubmit("save")}
            disabled={busy || !draft.name.trim()}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit("addAnother")}
            disabled={busy || !draft.name.trim()}
            className="tap-target inline-flex items-center justify-center rounded-2xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save & Add Another
          </button>
        </div>
      </section>
    );
  },
);
