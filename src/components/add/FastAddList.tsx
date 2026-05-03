import { useMemo } from "react";
import type { InventoryItem } from "../../types/inventory";
import type { HouseholdProduct } from "../../types/product";
import { EmptyState } from "../common/EmptyState";

type FastAddEntry =
  | {
      id: string;
      dedupeKey: string;
      name: string;
      meta: string;
      kind: "product";
      product: HouseholdProduct;
    }
  | {
      id: string;
      dedupeKey: string;
      name: string;
      meta: string;
      kind: "inventory";
      item: InventoryItem;
    };

export function FastAddList({
  products,
  inventoryItems,
  onSelectProduct,
  onSelectInventoryItem,
}: {
  products: HouseholdProduct[];
  inventoryItems: InventoryItem[];
  onSelectProduct: (product: HouseholdProduct, sourceLabel: string) => void;
  onSelectInventoryItem: (item: InventoryItem) => void;
}) {
  const entries = useMemo(() => {
    const productEntries: FastAddEntry[] = products.map((product) => ({
      id: `product-${product.id}`,
      dedupeKey: `${product.normalizedName}-${product.brand || ""}`,
      name: product.name,
      meta: `${product.defaultUnit || "unit"} · ${product.defaultLocation}`,
      kind: "product",
      product,
    }));

    const inventoryEntries: FastAddEntry[] = [...inventoryItems]
      .sort((a, b) => (b.addedAt?.toMillis?.() ?? 0) - (a.addedAt?.toMillis?.() ?? 0))
      .map((item) => ({
        id: `inventory-${item.id}`,
        dedupeKey: `${item.normalizedName}-${item.brand || ""}`,
        name: item.name,
        meta: `${item.unit} · ${item.location}${item.brand ? ` · ${item.brand}` : ""}`,
        kind: "inventory",
        item,
      }));

    const seen = new Set<string>();
    return [...productEntries, ...inventoryEntries]
      .filter((entry) => {
        if (seen.has(entry.dedupeKey)) return false;
        seen.add(entry.dedupeKey);
        return true;
      })
      .slice(0, 10);
  }, [inventoryItems, products]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-black text-kitchen-ink">Add again</h2>
        <p className="text-sm text-kitchen-muted">Tap a food you already use.</p>
      </div>
      {entries.length ? (
        <div className="grid grid-cols-2 gap-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() =>
                entry.kind === "product"
                  ? onSelectProduct(entry.product, "Your library")
                  : onSelectInventoryItem(entry.item)
              }
              className="min-h-24 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 transition active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-kitchen-green">
                {entry.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="mt-2 block line-clamp-2 text-sm font-bold text-kitchen-ink">
                {entry.name}
              </span>
              <span className="mt-1 block truncate text-xs text-kitchen-muted">{entry.meta}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing to reuse yet." body="Add one item and it will appear here." />
      )}
    </section>
  );
}
