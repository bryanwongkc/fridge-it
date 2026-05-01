import { useState, type FormEvent } from "react";
import type { ProductInput, ProductLocation } from "../../types/product";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

const locations: ProductLocation[] = ["fridge", "freezer", "pantry", "other"];

export function ProductCreateForm({
  initialName = "",
  initialBarcode = null,
  initialProduct,
  submitLabel = "Save product",
  onCancel,
  onSubmit,
}: {
  initialName?: string;
  initialBarcode?: string | null;
  initialProduct?: ProductInput;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}) {
  const [name, setName] = useState(initialProduct?.name || initialName);
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [category, setCategory] = useState(initialProduct?.category || "");
  const [barcode, setBarcode] = useState(initialProduct?.barcode || initialBarcode || "");
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || "");
  const [defaultUnit, setDefaultUnit] = useState(initialProduct?.defaultUnit || "");
  const [defaultLocation, setDefaultLocation] = useState<ProductLocation>(
    initialProduct?.defaultLocation || "fridge",
  );
  const [defaultShelfLifeDays, setDefaultShelfLifeDays] = useState(
    initialProduct?.defaultShelfLifeDays?.toString() || "",
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit({
      name,
      brand: brand || null,
      category: category || null,
      barcode: barcode || null,
      imageUrl: imageUrl || null,
      defaultUnit: defaultUnit || null,
      defaultLocation,
      defaultShelfLifeDays: defaultShelfLifeDays ? Number(defaultShelfLifeDays) : null,
    });
    setSaving(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h1 className="text-xl font-black text-kitchen-ink">Create product</h1>
          <p className="text-sm text-kitchen-muted">Add the useful defaults. Stock comes next.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-kitchen-ink">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-kitchen-ink">Brand</span>
            <input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-kitchen-ink">Category</span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
            />
          </label>
        </div>
        <div>
          <span className="text-sm font-semibold text-kitchen-ink">Default location</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {locations.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => setDefaultLocation(location)}
                className={`min-h-10 rounded-2xl text-xs font-bold capitalize ${
                  defaultLocation === location
                    ? "bg-kitchen-green text-white"
                    : "bg-slate-100 text-kitchen-muted"
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-kitchen-ink">Unit</span>
            <input
              value={defaultUnit}
              placeholder="pack, pcs, bottle"
              onChange={(event) => setDefaultUnit(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-kitchen-ink">Shelf life</span>
            <input
              value={defaultShelfLifeDays}
              inputMode="numeric"
              placeholder="days"
              onChange={(event) => setDefaultShelfLifeDays(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-kitchen-ink">Barcode</span>
          <input
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-kitchen-ink">Image URL</span>
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="mt-1 min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
