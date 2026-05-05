import { Link } from "react-router-dom";
import { Archive, ClipboardList, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/layout/EmptyState";
import { InventoryItemCard } from "../components/inventory/InventoryItemCard";
import { ItemActionSheet } from "../components/inventory/ItemActionSheet";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useBuySoon } from "../hooks/useBuySoon";
import { useGroceryList } from "../hooks/useGroceryList";
import { useInventory, type InventoryItemWithExpiry } from "../hooks/useInventory";
import { LOCATION_LABELS } from "../utils/constants";
import { addDaysDateString } from "../utils/dateUtils";

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-800"
        : "bg-white text-ink";

  return (
    <div className={`rounded-2xl border border-stone-200 p-4 shadow-soft ${toneClass}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{label}</p>
    </div>
  );
}

export function DashboardPage() {
  const {
    items,
    counts,
    loading,
    markItemConsumed,
    markItemDiscarded,
    keepItemForNow,
    extendItemExpiry,
  } = useInventory();
  const { buySoonItems, loading: buySoonLoading } = useBuySoon();
  const { uncheckedCount, loading: groceryLoading } = useGroceryList();
  const [activeSheetItem, setActiveSheetItem] = useState<InventoryItemWithExpiry | null>(null);

  const needsActionItems = useMemo(
    () =>
      items
        .filter(
          (item) => item.expiryStatus === "expired" || item.expiryStatus === "expiringSoon",
        )
        .slice(0, 3),
    [items],
  );

  async function handleExtend(itemId: string) {
    await extendItemExpiry(itemId, addDaysDateString(7));
  }

  if (loading || buySoonLoading || groceryLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-semibold text-moss">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Needs Action</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Keep the items that need a quick decision close to the top.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatTile label="Expired" value={counts.expired} tone="danger" />
        <StatTile label="Expiring soon" value={counts.expiringSoon} tone="warning" />
        <StatTile label="Buy soon" value={buySoonItems.length} tone="warning" />
        <StatTile label="Grocery" value={uncheckedCount} />
        <StatTile label="Unknown expiry" value={counts.unknown} />
        <StatTile label="Total items" value={counts.total} />
      </section>

      {items.length === 0 ? (
        <EmptyState
          title="Start by adding what's already at home"
          description="A few common fridge, freezer, and pantry items are enough to make the dashboard useful."
          action={
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                to="/add"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
              >
                <PlusCircle className="h-4 w-4" />
                Add existing stock
              </Link>
              <Link
                to="/bulk-setup"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
              >
                <Archive className="h-4 w-4" />
                Bulk setup
              </Link>
            </div>
          }
        />
      ) : needsActionItems.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-ink">Review these</h2>
            <Link to="/inventory" className="text-sm font-semibold text-moss">
              See all
            </Link>
          </div>
          {needsActionItems.map((item) => (
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
      ) : (
        <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Nothing urgent</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            No expired or nearly expired items right now.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Buy Soon</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Items below your usual household stock.
            </p>
          </div>
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-stone-100 px-3 text-sm font-bold text-stone-500">
            {buySoonItems.length}
          </span>
        </div>
        {buySoonItems.length > 0 ? (
          <div className="mt-4 space-y-2">
            {buySoonItems.slice(0, 3).map((item) => (
              <div key={item.templateId} className="rounded-2xl bg-stone-50 p-3">
                <p className="text-sm font-bold text-ink">{item.displayName}</p>
                <p className="mt-1 text-xs leading-5 text-stone-600">{item.reason}</p>
              </div>
            ))}
          </div>
        ) : null}
        <Link
          to="/buy-soon"
          className="tap-target mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
        >
          <ClipboardList className="h-4 w-4" />
          Open Buy Soon
        </Link>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Inventory by location</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Object.entries(counts.byLocation).map(([location, value]) => (
            <div key={location} className="rounded-2xl bg-stone-50 p-4">
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="mt-1 text-sm font-semibold text-stone-600">
                {LOCATION_LABELS[location as keyof typeof LOCATION_LABELS]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/add"
        className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white shadow-soft"
      >
        <PlusCircle className="h-4 w-4" />
        Quick Add
      </Link>

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
