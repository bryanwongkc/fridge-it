import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { mergeInventoryQuantity, updateInventoryItem } from "../../services/inventoryService";
import type { InventoryItem } from "../../types/inventory";
import type { ProductLocation } from "../../types/product";
import { mergeCategories } from "../../utils/categories";
import { getExpiryStatus } from "../../utils/expiry";
import { normalizeText } from "../../utils/normalize";
import { EmptyState } from "../common/EmptyState";
import { InventoryCard } from "./InventoryCard";
import { InventoryEditSheet } from "./InventoryEditSheet";

const locationFilters: Array<"all" | ProductLocation> = [
  "all",
  "fridge",
  "freezer",
  "pantry",
  "other",
];

export function InventoryPage({
  householdId,
  items,
  onUsed,
  onShopping,
  onDelete,
}: {
  householdId: string;
  items: InventoryItem[];
  onUsed: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<(typeof locationFilters)[number]>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const categoryFilters = useMemo(
    () => ["all", ...mergeCategories(items.map((item) => item.category)), "other"],
    [items],
  );

  const filtered = useMemo(() => {
    const normalized = normalizeText(query);
    return items
      .filter((item) => item.status === "active")
      .filter((item) => !normalized || item.normalizedName.includes(normalized))
      .filter((item) => {
        if (locationFilter === "all") return true;
        return item.location === locationFilter;
      })
      .filter((item) => {
        if (categoryFilter === "all") return true;
        const normalizedCategory = item.category ? normalizeText(item.category) : "";
        if (categoryFilter === "other") {
          const known = categoryFilters
            .filter((category) => !["all", "other"].includes(category))
            .map(normalizeText);
          return !normalizedCategory || !known.includes(normalizedCategory);
        }
        return normalizedCategory === normalizeText(categoryFilter);
      });
  }, [categoryFilter, categoryFilters, items, locationFilter, query]);

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
      <div className="space-y-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {locationFilters.map((nextFilter) => (
            <button
              key={nextFilter}
              type="button"
              onClick={() => setLocationFilter(nextFilter)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold capitalize ${
                locationFilter === nextFilter
                  ? "bg-kitchen-green text-white"
                  : "bg-white text-kitchen-muted"
              }`}
            >
              {nextFilter}
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {categoryFilters.map((nextFilter) => (
            <button
              key={nextFilter}
              type="button"
              onClick={() => setCategoryFilter(nextFilter)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${
                categoryFilter === nextFilter
                  ? "bg-kitchen-green text-white"
                  : "bg-white text-kitchen-muted"
              }`}
            >
              {nextFilter === "all" ? "All" : nextFilter === "other" ? "Other" : nextFilter}
            </button>
          ))}
        </div>
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
                onDelete={onDelete}
                onShopping={onShopping}
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
