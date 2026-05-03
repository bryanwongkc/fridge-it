import { Plus, Refrigerator, ShoppingBasket } from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import { getDaysUntilExpiry } from "../../utils/dates";
import { expiryTone, getExpiryStatus, type ExpiryStatus } from "../../utils/expiry";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { LoadingState } from "../common/LoadingState";
import { PriorityList } from "./PriorityList";

export function Dashboard({
  householdId,
  items,
  summary,
  loading,
  onAddStock,
  onUsed,
  onShopping,
  onEdit,
}: {
  householdId: string;
  items: InventoryItem[];
  summary: { expired: number; today: number; next3Days: number; thisWeek: number; safe: number };
  loading: boolean;
  onAddStock: () => void;
  onUsed: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
}) {
  const activeItems = items.filter((item) => item.status === "active");
  const priorityItems = [...activeItems]
    .filter((item) => {
      const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);
      return ["expired", "today", "tomorrow", "soon_3_days"].includes(status);
    })
    .sort((a, b) => {
      const aDays = a.expiryDate ? getDaysUntilExpiry(a.expiryDate) : 999;
      const bDays = b.expiryDate ? getDaysUntilExpiry(b.expiryDate) : 999;
      return aDays - bDays;
    })
    .slice(0, 8);

  const useFirst = priorityItems.length ? priorityItems : activeItems.slice(0, 5);
  const urgentCount = summary.expired + summary.today + summary.next3Days;
  const noExpiryCount = activeItems.filter(
    (item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "no_expiry",
  ).length;
  const locationCounts = countBy(activeItems, (item) => item.location);
  const categoryCounts = Object.entries(countBy(activeItems, (item) => item.category || "Other"))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const statusText =
    urgentCount > 0
      ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need attention`
      : "No urgent expiry today";

  return (
    <section className="space-y-4 pb-3">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-kitchen-muted">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-normal text-kitchen-ink">
              Food status
            </h1>
            <p className="mt-0.5 truncate text-sm font-semibold text-kitchen-muted">
              {householdId}
            </p>
          </div>
          <Button
            onClick={onAddStock}
            icon={<Plus size={16} />}
            className="min-h-10 shrink-0 px-3"
          >
            Add
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-[1.1fr_0.9fr] gap-3">
          <div className={`rounded-2xl p-3 ${urgentCount ? "bg-orange-50" : "bg-emerald-50"}`}>
            <p
              className={`text-3xl font-black ${
                urgentCount ? "text-orange-700" : "text-kitchen-green"
              }`}
            >
              {urgentCount}
            </p>
            <p className="mt-0.5 text-xs font-bold text-kitchen-ink">Need attention</p>
            <p className="mt-1 text-xs text-kitchen-muted">{statusText}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-3xl font-black text-kitchen-ink">{activeItems.length}</p>
            <p className="mt-0.5 text-xs font-bold text-kitchen-ink">Active stock</p>
            <p className="mt-1 text-xs text-kitchen-muted">{noExpiryCount} no expiry</p>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-5 gap-2">
        <StatusTile label="Expired" value={summary.expired} status="expired" />
        <StatusTile label="Today" value={summary.today} status="today" />
        <StatusTile label="3 days" value={summary.next3Days} status="soon_3_days" />
        <StatusTile label="Week" value={summary.thisWeek} status="this_week" />
        <StatusTile label="Safe" value={summary.safe} status="safe" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <Refrigerator size={16} className="text-kitchen-green" />
            <h2 className="text-sm font-black text-kitchen-ink">Locations</h2>
          </div>
          <div className="space-y-2">
            {["fridge", "freezer", "pantry", "other"].map((location) => (
              <MiniBar
                key={location}
                label={location}
                value={locationCounts[location] || 0}
                total={activeItems.length}
              />
            ))}
          </div>
        </Card>

        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBasket size={16} className="text-kitchen-green" />
            <h2 className="text-sm font-black text-kitchen-ink">Categories</h2>
          </div>
          <div className="space-y-2">
            {categoryCounts.length ? (
              categoryCounts.map(([category, value]) => (
                <MiniBar
                  key={category}
                  label={category}
                  value={value}
                  total={activeItems.length}
                />
              ))
            ) : (
              <p className="text-xs font-semibold text-kitchen-muted">No category data</p>
            )}
          </div>
        </Card>
      </section>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-black text-kitchen-ink">Use first</h2>
          <span className="text-xs font-bold text-kitchen-muted">{useFirst.length} shown</span>
        </div>
        {loading ? (
          <LoadingState label="Checking your fridge..." />
        ) : (
          <PriorityList
            items={useFirst}
            onUsed={onUsed}
            onShopping={onShopping}
            onEdit={onEdit}
          />
        )}
      </div>
    </section>
  );
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item).trim() || "Other";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function StatusTile({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: ExpiryStatus;
}) {
  return (
    <div className={`rounded-2xl p-2 text-center ${expiryTone(status)}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-bold">{label}</p>
    </div>
  );
}

function MiniBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.max(8, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-bold capitalize text-kitchen-ink">{label}</span>
        <span className="font-black text-kitchen-muted">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-kitchen-green" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
