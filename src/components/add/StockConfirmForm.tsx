import { CalendarDays, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { HouseholdProduct, ProductLocation } from "../../types/product";
import { addDays, formatDate } from "../../utils/dates";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

const locations: ProductLocation[] = ["fridge", "freezer", "pantry", "other"];
const dayPresets = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "+3 days", days: 3 },
  { label: "+1 week", days: 7 },
  { label: "+2 weeks", days: 14 },
];
const freezerPresets = [
  { label: "+1 month", days: 30 },
  { label: "+3 months", days: 90 },
  { label: "+6 months", days: 180 },
];

export function StockConfirmForm({
  product,
  sourceLabel,
  onSave,
  onEditProduct,
}: {
  product: HouseholdProduct;
  sourceLabel: string;
  onSave: (input: {
    quantity: number;
    unit: string;
    location: ProductLocation;
    expiryDate: string | null;
    hasNoExpiry: boolean;
    notes: string | null;
  }) => Promise<void>;
  onEditProduct: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(product.defaultUnit || "item");
  const [location, setLocation] = useState<ProductLocation>(product.defaultLocation || "fridge");
  const [expiryDate, setExpiryDate] = useState<string | null>(() =>
    product.defaultShelfLifeDays ? formatDate(addDays(new Date(), product.defaultShelfLifeDays)) : null,
  );
  const [hasNoExpiry, setHasNoExpiry] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const suggestedDate = useMemo(
    () =>
      product.defaultShelfLifeDays
        ? formatDate(addDays(new Date(), product.defaultShelfLifeDays))
        : null,
    [product.defaultShelfLifeDays],
  );

  const save = async () => {
    setSaving(true);
    await onSave({
      quantity,
      unit,
      location,
      expiryDate: hasNoExpiry ? null : expiryDate,
      hasNoExpiry,
      notes: notes || null,
    });
    setSaving(false);
  };

  return (
    <section className="space-y-4">
      <Card>
        <div className="flex gap-4">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-kitchen-green">
              {product.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Badge className="bg-emerald-50 text-kitchen-green">{sourceLabel}</Badge>
            <h1 className="mt-2 line-clamp-2 text-2xl font-black text-kitchen-ink">
              {product.name}
            </h1>
            {product.brand ? <p className="text-sm text-kitchen-muted">{product.brand}</p> : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <span className="text-sm font-semibold text-kitchen-ink">Quantity</span>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>
            <input
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              inputMode="decimal"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-kitchen-line text-center text-lg font-black outline-none focus:border-kitchen-green"
            />
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-kitchen-ink">Unit</span>
          <input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
          />
        </label>

        <div>
          <span className="text-sm font-semibold text-kitchen-ink">Location</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {locations.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLocation(item)}
                className={`min-h-11 rounded-2xl text-xs font-bold capitalize ${
                  location === item ? "bg-kitchen-green text-white" : "bg-slate-100 text-kitchen-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-kitchen-ink">Expiry date</span>
            <label className="flex items-center gap-2 text-sm font-semibold text-kitchen-muted">
              <input
                type="checkbox"
                checked={hasNoExpiry}
                onChange={(event) => setHasNoExpiry(event.target.checked)}
                className="h-4 w-4 rounded"
              />
              No expiry
            </label>
          </div>
          {!hasNoExpiry ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(location === "freezer" ? [...dayPresets, ...freezerPresets] : dayPresets).map(
                  (preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setExpiryDate(formatDate(addDays(new Date(), preset.days)))}
                      className="min-h-10 rounded-2xl bg-slate-100 px-2 text-xs font-bold text-kitchen-ink"
                    >
                      {preset.label}
                    </button>
                  ),
                )}
              </div>
              <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-kitchen-line px-4">
                <CalendarDays size={18} className="text-kitchen-muted" />
                <input
                  type="date"
                  value={expiryDate || ""}
                  onChange={(event) => setExpiryDate(event.target.value || null)}
                  className="min-w-0 flex-1 outline-none"
                />
              </label>
              {suggestedDate ? (
                <button
                  type="button"
                  onClick={() => setExpiryDate(suggestedDate)}
                  className="text-sm font-semibold text-kitchen-green"
                >
                  Usually lasts {product.defaultShelfLifeDays} days · Use {suggestedDate}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setNotesOpen((value) => !value)}
            className="text-sm font-semibold text-kitchen-green"
          >
            {notesOpen ? "Hide notes" : "Add notes"}
          </button>
          {notesOpen ? (
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-kitchen-line p-3 outline-none focus:border-kitchen-green"
            />
          ) : null}
        </div>
      </Card>

      <div className="sticky bottom-24 z-20 grid grid-cols-[0.8fr_1.2fr] gap-3">
        <Button type="button" variant="secondary" onClick={onEditProduct}>
          Edit product
        </Button>
        <Button type="button" disabled={saving || !unit.trim()} onClick={() => void save()}>
          {saving ? "Saving..." : "Save Stock"}
        </Button>
      </div>
    </section>
  );
}
