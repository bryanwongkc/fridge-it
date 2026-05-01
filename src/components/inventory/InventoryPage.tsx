import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { mergeInventoryQuantity, updateInventoryItem } from "../../services/inventoryService";
import { addShoppingItem } from "../../services/shoppingService";
import type { InventoryItem } from "../../types/inventory";
import type { ProductLocation } from "../../types/product";
import { getExpiryStatus } from "../../utils/expiry";
import { normalizeText } from "../../utils/normalize";
import { EmptyState } from "../common/EmptyState";
import { InventoryCard } from "./InventoryCard";
import { InventoryEditSheet } from "./InventoryEditSheet";

const filters: Array<"all" | ProductLocation | "expired" | "useSoon"> = [
  "all",
  "fridge",
  "freezer",
  "pantry",
  "expired",
  "useSoon",
];

export function InventoryPage({
  householdId,
  items,
  onUsed,
}: {
  householdId: string;
  items: InventoryItem[];
  onUsed: (item: InventoryItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    const normalized = normalizeText(query);
    return items
      .filter((item) => item.status === "active")
      .filter((item) => !normalized || item.normalizedName.includes(normalized))
      .filter((item) => {
        if (filter === "all") return true;
        if (["fridge", "freezer", "pantry", "other"].includes(filter)) return item.location === filter;
        const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);
        if (filter === "expired") return status === "expired";
        return ["today", "tomorrow", "soon_3_days"].includes(status);
      });
  }, [filter, items, query]);

  const groups = [
    { title: "Expired", items: filtered.filter((item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "expired") },
    { title: "Use Today", items: filtered.filter((item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "today") },
    { title: "Use Soon", items: filtered.filter((item) => ["tomorrow", "soon_3_days"].includes(getExpiryStatus(item.expiryDate, item.hasNoExpiry))) },
    { title: "This Week", items: filtered.filter((item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "this_week") },
    { title: "Safe", items: filtered.filter((item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "safe") },
    { title: "No Expiry", items: filtered.filter((item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "no_expiry") },
  ].filter((group) => group.items.length);

  return (
    <section className="space-y-4 pb-4">
      <div>
        <h1 className="text-2xl font-black text-kitchen-ink">Inventory</h1>
        <p className="text-sm text-kitchen-muted">Batches stay separate by expiry date.</p>
      </div>
      <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-kitchen-line bg-white px-4">
        <Search size={18} className="text-kitchen-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stock"
          className="min-w-0 flex-1 outline-none"
        />
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {filters.map((nextFilter) => (
          <button
            key={nextFilter}
            type="button"
            onClick={() => setFilter(nextFilter)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold capitalize ${
              filter === nextFilter ? "bg-kitchen-green text-white" : "bg-white text-kitchen-muted"
            }`}
          >
            {nextFilter === "useSoon" ? "Use Soon" : nextFilter}
          </button>
        ))}
      </div>

      {groups.length ? (
        groups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-lg font-black text-kitchen-ink">{group.title}</h2>
            {group.items.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onUsed={onUsed}
                onEdit={setEditing}
                onShopping={(stock) =>
                  void addShoppingItem(householdId, {
                    name: stock.name,
                    productId: stock.productId,
                    publicProductId: stock.publicProductId,
                    unit: stock.unit,
                    source: "inventory_action",
                  })
                }
                onAdjust={(stock, delta) =>
                  void mergeInventoryQuantity(
                    householdId,
                    stock.id,
                    Math.max(1, stock.quantity + delta),
                  )
                }
              />
            ))}
          </div>
        ))
      ) : (
        <EmptyState title="No inventory yet." />
      )}

      <InventoryEditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(item, fields) => updateInventoryItem(householdId, item.id, fields)}
      />
    </section>
  );
}
