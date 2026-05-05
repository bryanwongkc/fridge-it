import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { EmptyState } from "../components/layout/EmptyState";
import { InventoryFilters, type LocationFilter, type StatusFilter } from "../components/inventory/InventoryFilters";
import { InventoryItemCard } from "../components/inventory/InventoryItemCard";
import { ItemActionSheet } from "../components/inventory/ItemActionSheet";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useInventory, type InventoryItemWithExpiry } from "../hooks/useInventory";
import { addDaysDateString } from "../utils/dateUtils";

export function InventoryPage() {
  const {
    items,
    loading,
    markItemConsumed,
    markItemDiscarded,
    keepItemForNow,
    extendItemExpiry,
  } = useInventory();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeSheetItem, setActiveSheetItem] = useState<InventoryItemWithExpiry | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.normalizedName.includes(normalizedSearch);
      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      const matchesStatus = statusFilter === "all" || item.expiryStatus === statusFilter;
      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [items, locationFilter, search, statusFilter]);

  async function handleExtend(itemId: string) {
    await extendItemExpiry(itemId, addDaysDateString(7));
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-moss">Inventory</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">What is at home</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Search, filter, and handle items without leaving the list.
          </p>
        </div>
        <Link
          to="/add"
          className="tap-target inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Add
        </Link>
      </header>

      <InventoryFilters
        search={search}
        locationFilter={locationFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onLocationFilterChange={setLocationFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Start by adding what's already at home"
          description="A few fridge, freezer, and pantry items are enough to make this useful."
          action={
            <Link
              to="/add"
              className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Add existing stock
            </Link>
          }
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No items match"
          description="Try a different search, location, or expiry filter."
        />
      ) : (
        <section className="space-y-3">
          {filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onActions={setActiveSheetItem}
              onConsumed={markItemConsumed}
              onDiscarded={markItemDiscarded}
              onKeep={keepItemForNow}
              onExtend={handleExtend}
            />
          ))}
        </section>
      )}

      <ItemActionSheet
        item={activeSheetItem}
        onClose={() => setActiveSheetItem(null)}
        onConsumed={markItemConsumed}
        onDiscarded={markItemDiscarded}
        onKeep={keepItemForNow}
        onExtend={extendItemExpiry}
      />
    </div>
  );
}
