import { useMemo } from "react";
import type { InventoryItem } from "../../types/inventory";
import { EmptyState } from "../common/EmptyState";

export function PreviousItems({
  items,
  onSelect,
}: {
  items: InventoryItem[];
  onSelect: (item: InventoryItem) => void;
}) {
  const previousItems = useMemo(() => {
    const seen = new Set<string>();
    return [...items]
      .sort((a, b) => {
        const aAdded = a.addedAt?.toMillis?.() ?? 0;
        const bAdded = b.addedAt?.toMillis?.() ?? 0;
        return bAdded - aAdded;
      })
      .filter((item) => {
        const key = `${item.normalizedName}-${item.brand || ""}-${item.unit}-${item.location}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  }, [items]);

  return (
    <section>
      <h2 className="mb-3 text-lg font-black text-kitchen-ink">Previously entered items</h2>
      {previousItems.length ? (
        <div className="space-y-3">
          {previousItems.map((item) => (
            <button
              key={`${item.id}-${item.normalizedName}`}
              type="button"
              onClick={() => onSelect(item)}
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 transition active:scale-[0.99]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-kitchen-ink">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-kitchen-muted">
                  {item.unit} · {item.location}
                  {item.brand ? ` · ${item.brand}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-kitchen-green">Add</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No previous items yet." body="Items you add will appear here." />
      )}
    </section>
  );
}
