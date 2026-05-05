import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ExpiryPresetChips } from "../add/ExpiryPresetChips";
import { QuantityControl } from "../add/QuantityControl";
import type { HouseholdItemTemplate, UpdateTemplateInput } from "../../types/library";
import type { Category, ExpiryPreset, PercentageValue, QuantityMode, Unit } from "../../types/inventory";
import type { HouseholdLocation } from "../../types/household";
import {
  CATEGORY_LABELS,
  HOUSEHOLD_LOCATIONS,
  LOCATION_LABELS,
} from "../../utils/constants";

interface TemplateEditFormProps {
  template: HouseholdItemTemplate;
  busy: boolean;
  onClose: () => void;
  onSave: (templateId: string, input: UpdateTemplateInput) => Promise<void>;
}

export function TemplateEditForm({ template, busy, onClose, onSave }: TemplateEditFormProps) {
  const [displayName, setDisplayName] = useState(template.displayName);
  const [category, setCategory] = useState<Category>(template.category);
  const [location, setLocation] = useState<HouseholdLocation>(template.defaultLocation);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>(
    template.quantityMode ?? "percentage",
  );
  const [percentage, setPercentage] = useState<PercentageValue>(
    (template.defaultPercentageRemaining ?? 100) as PercentageValue,
  );
  const [quantity, setQuantity] = useState(template.defaultQuantity ?? 1);
  const [unit, setUnit] = useState<Unit>(template.defaultUnit ?? "pcs");
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>(template.expiryPreset ?? "unknown");
  const [desiredStockEnabled, setDesiredStockEnabled] = useState(template.desiredStockEnabled);
  const [desiredMinQuantity, setDesiredMinQuantity] = useState(template.desiredMinQuantity ?? 1);
  const [desiredMinPercentage, setDesiredMinPercentage] = useState(
    template.desiredMinPercentage ?? 25,
  );
  const [favorite, setFavorite] = useState(template.favorite);
  const [barcodesText, setBarcodesText] = useState(template.barcodes.join(", "));

  useEffect(() => {
    setDisplayName(template.displayName);
    setCategory(template.category);
    setLocation(template.defaultLocation);
    setQuantityMode(template.quantityMode ?? "percentage");
    setPercentage((template.defaultPercentageRemaining ?? 100) as PercentageValue);
    setQuantity(template.defaultQuantity ?? 1);
    setUnit(template.defaultUnit ?? "pcs");
    setExpiryPreset(template.expiryPreset ?? "unknown");
    setDesiredStockEnabled(template.desiredStockEnabled);
    setDesiredMinQuantity(template.desiredMinQuantity ?? 1);
    setDesiredMinPercentage(template.desiredMinPercentage ?? 25);
    setFavorite(template.favorite);
    setBarcodesText(template.barcodes.join(", "));
  }, [template]);

  async function handleSave() {
    await onSave(template.id, {
      displayName,
      category,
      defaultLocation: location,
      quantityMode,
      defaultQuantity: quantityMode === "count" ? quantity : null,
      defaultUnit: quantityMode === "count" ? unit : null,
      defaultPercentageRemaining: quantityMode === "percentage" ? percentage : null,
      expiryPreset,
      desiredStockEnabled,
      desiredMinQuantity: desiredStockEnabled && quantityMode === "count" ? desiredMinQuantity : null,
      desiredMinPercentage:
        desiredStockEnabled && quantityMode === "percentage" ? desiredMinPercentage : null,
      favorite,
      barcodes: barcodesText
        .split(",")
        .map((barcode) => barcode.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/30 px-4 pb-6 pt-10">
      <section className="mx-auto max-w-xl rounded-[1.5rem] bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss">Library</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Edit defaults</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600"
            aria-label="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            >
              {CATEGORY_LABELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-semibold text-stone-700">Default location</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {HOUSEHOLD_LOCATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocation(option)}
                  className={[
                    "tap-target rounded-full px-4 text-sm font-semibold",
                    option === location
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
            <p className="text-sm font-semibold text-stone-700">Default quantity</p>
            <div className="mt-2">
              <QuantityControl
                mode={quantityMode}
                percentage={percentage}
                quantity={quantity}
                unit={unit}
                onModeChange={setQuantityMode}
                onPercentageChange={setPercentage}
                onQuantityChange={setQuantity}
                onUnitChange={setUnit}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-700">Default expiry</p>
            <div className="mt-2">
              <ExpiryPresetChips value={expiryPreset} onChange={setExpiryPreset} />
            </div>
          </div>

          <div className="rounded-2xl bg-stone-50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={desiredStockEnabled}
                onChange={(event) => setDesiredStockEnabled(event.target.checked)}
                className="h-5 w-5 accent-moss"
              />
              Remember desired stock
            </label>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Use this to remind your household when to buy soon.
            </p>
            {desiredStockEnabled ? (
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-stone-700">
                  {quantityMode === "count" ? "Minimum count" : "Minimum percentage"}
                </span>
                <input
                  type="number"
                  min="0"
                  value={quantityMode === "count" ? desiredMinQuantity : desiredMinPercentage}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (quantityMode === "count") {
                      setDesiredMinQuantity(value);
                    } else {
                      setDesiredMinPercentage(value);
                    }
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base outline-none focus:border-moss"
                />
              </label>
            ) : null}
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(event) => setFavorite(event.target.checked)}
              className="h-5 w-5 accent-moss"
            />
            Favorite
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Barcodes</span>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              Optional. These only help this household reuse the item faster.
            </p>
            <input
              value={barcodesText}
              onChange={(event) => setBarcodesText(event.target.value)}
              placeholder="Separate barcodes with commas"
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy || !displayName.trim()}
            className="tap-target w-full rounded-2xl bg-moss px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save defaults
          </button>
        </div>
      </section>
    </div>
  );
}
