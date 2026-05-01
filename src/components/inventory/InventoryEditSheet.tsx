import { useState } from "react";
import type { InventoryItem } from "../../types/inventory";
import type { ProductLocation } from "../../types/product";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

const locations: ProductLocation[] = ["fridge", "freezer", "pantry", "other"];

export function InventoryEditSheet({
  item,
  onSave,
  onClose,
}: {
  item: InventoryItem | null;
  onSave: (
    item: InventoryItem,
    fields: Pick<
      InventoryItem,
      "quantity" | "unit" | "location" | "expiryDate" | "hasNoExpiry" | "notes" | "status"
    >,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(item?.quantity.toString() || "1");
  const [unit, setUnit] = useState(item?.unit || "item");
  const [location, setLocation] = useState<ProductLocation>(item?.location || "fridge");
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate || "");
  const [hasNoExpiry, setHasNoExpiry] = useState(item?.hasNoExpiry || false);
  const [notes, setNotes] = useState(item?.notes || "");
  const [status, setStatus] = useState<InventoryItem["status"]>(item?.status || "active");
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const save = async () => {
    setSaving(true);
    await onSave(item, {
      quantity: Math.max(0, Number(quantity) || 0),
      unit,
      location,
      expiryDate: hasNoExpiry ? null : expiryDate || null,
      hasNoExpiry,
      notes: notes || null,
      status,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-4">
      <Card className="max-h-[88vh] w-full overflow-y-auto">
        <h2 className="text-xl font-black text-kitchen-ink">Edit stock</h2>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm font-semibold text-kitchen-ink">Quantity</span>
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="decimal"
                className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-kitchen-ink">Unit</span>
              <input
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
              />
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {locations.map((nextLocation) => (
              <button
                key={nextLocation}
                type="button"
                onClick={() => setLocation(nextLocation)}
                className={`min-h-10 rounded-2xl text-xs font-bold capitalize ${
                  location === nextLocation
                    ? "bg-kitchen-green text-white"
                    : "bg-slate-100 text-kitchen-muted"
                }`}
              >
                {nextLocation}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-kitchen-muted">
            <input
              type="checkbox"
              checked={hasNoExpiry}
              onChange={(event) => setHasNoExpiry(event.target.checked)}
            />
            No expiry
          </label>
          {!hasNoExpiry ? (
            <input
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
            />
          ) : null}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as InventoryItem["status"])}
            className="min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
          >
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="discarded">Discarded</option>
          </select>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
            rows={3}
            className="w-full rounded-2xl border border-kitchen-line p-3 outline-none focus:border-kitchen-green"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
