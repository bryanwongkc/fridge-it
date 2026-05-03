import { Plus, Refrigerator, ShoppingBasket, X } from "lucide-react";
import { useState } from "react";
import type { InventoryItem } from "../../types/inventory";
import { getDaysUntilExpiry, relativeExpiryLabel } from "../../utils/dates";
import { expiryTone, getExpiryStatus, type ExpiryStatus } from "../../utils/expiry";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { LoadingState } from "../common/LoadingState";
import { PriorityList } from "./PriorityList";

interface DetailView {
  title: string;
  subtitle: string;
  items: InventoryItem[];
}

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
  const [detail, setDetail] = useState<DetailView | null>(null);
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
  const urgentItems = activeItems.filter((item) =>
    ["expired", "today", "tomorrow", "soon_3_days"].includes(
      getExpiryStatus(item.expiryDate, item.hasNoExpiry),
    ),
  );
  const noExpiryCount = activeItems.filter(
    (item) => getExpiryStatus(item.expiryDate, item.hasNoExpiry) === "no_expiry",
  ).length;
  const locationCounts = countBy(activeItems, (item) => item.location);
  const categoryCounts = Object.entries(countBy(activeItems, (item) => item.category || "Other"))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const urgentCount = summary.expired + summary.today + summary.next3Days;
  const statusText =
    urgentCount > 0
      ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need attention`
      : "No urgent expiry today";

  const openDetail = (title: string, subtitle: string, nextItems: InventoryItem[]) => {
    setDetail({ title, subtitle, items: sortByExpiry(nextItems) });
  };

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
          <button
            type="button"
            onClick={() => openDetail("Need attention", statusText, urgentItems)}
            className={`rounded-2xl p-3 text-left transition active:scale-[0.99] ${
              urgentCount ? "bg-orange-50" : "bg-emerald-50"
            }`}
          >
            <p
              className={`text-3xl font-black ${
                urgentCount ? "text-orange-700" : "text-kitchen-green"
              }`}
            >
              {urgentCount}
            </p>
            <p className="mt-0.5 text-xs font-bold text-kitchen-ink">Need attention</p>
            <p className="mt-1 text-xs text-kitchen-muted">{statusText}</p>
          </button>
          <button
            type="button"
            onClick={() =>
              openDetail("Active stock", `${activeItems.length} active inventory batches`, activeItems)
            }
            className="rounded-2xl bg-slate-50 p-3 text-left transition active:scale-[0.99]"
          >
            <p className="text-3xl font-black text-kitchen-ink">{activeItems.length}</p>
            <p className="mt-0.5 text-xs font-bold text-kitchen-ink">Active stock</p>
            <p className="mt-1 text-xs text-kitchen-muted">{noExpiryCount} no expiry</p>
          </button>
        </div>
      </Card>

      <section className="grid grid-cols-5 gap-2">
        <StatusTile
          label="Expired"
          value={summary.expired}
          status="expired"
          onClick={() =>
            openDetail(
              "Expired",
              "Items past their expiry date",
              itemsByExpiryStatus(activeItems, ["expired"]),
            )
          }
        />
        <StatusTile
          label="Today"
          value={summary.today}
          status="today"
          onClick={() =>
            openDetail("Expires today", "Use these first", itemsByExpiryStatus(activeItems, ["today"]))
          }
        />
        <StatusTile
          label="3 days"
          value={summary.next3Days}
          status="soon_3_days"
          onClick={() =>
            openDetail(
              "Next 3 days",
              "Items expiring tomorrow or soon",
              itemsByExpiryStatus(activeItems, ["tomorrow", "soon_3_days"]),
            )
          }
        />
        <StatusTile
          label="Week"
          value={summary.thisWeek}
          status="this_week"
          onClick={() =>
            openDetail("This week", "Items expiring within a week", itemsByExpiryStatus(activeItems, ["this_week"]))
          }
        />
        <StatusTile
          label="Safe"
          value={summary.safe}
          status="safe"
          onClick={() =>
            openDetail(
              "Safe stock",
              "Items with more time or no expiry",
              itemsByExpiryStatus(activeItems, ["safe", "no_expiry"]),
            )
          }
        />
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
                onClick={() =>
                  openDetail(
                    location,
                    `${locationCounts[location] || 0} active item${locationCounts[location] === 1 ? "" : "s"}`,
                    activeItems.filter((item) => item.location === location),
                  )
                }
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
                  onClick={() =>
                    openDetail(
                      category,
                      `${value} active item${value === 1 ? "" : "s"}`,
                      activeItems.filter((item) => (item.category || "Other") === category),
                    )
                  }
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
            onSelect={(item) => openDetail(item.name, "Inventory detail", [item])}
          />
        )}
      </div>

      <DashboardDetailSheet
        detail={detail}
        onClose={() => setDetail(null)}
        onUsed={onUsed}
        onShopping={onShopping}
        onEdit={onEdit}
      />
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

function itemsByExpiryStatus(items: InventoryItem[], statuses: ExpiryStatus[]) {
  return items.filter((item) => statuses.includes(getExpiryStatus(item.expiryDate, item.hasNoExpiry)));
}

function sortByExpiry(items: InventoryItem[]) {
  return [...items].sort((a, b) => {
    const aDays = a.expiryDate ? getDaysUntilExpiry(a.expiryDate) : 999;
    const bDays = b.expiryDate ? getDaysUntilExpiry(b.expiryDate) : 999;
    return aDays - bDays;
  });
}

function StatusTile({
  label,
  value,
  status,
  onClick,
}: {
  label: string;
  value: number;
  status: ExpiryStatus;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl p-2 text-center transition active:scale-[0.98] ${expiryTone(status)}`}
    >
      <p className="text-lg font-black">{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-bold">{label}</p>
    </button>
  );
}

function MiniBar({
  label,
  value,
  total,
  onClick,
}: {
  label: string;
  value: number;
  total: number;
  onClick: () => void;
}) {
  const width = total ? Math.max(8, Math.round((value / total) * 100)) : 0;

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-bold capitalize text-kitchen-ink">{label}</span>
        <span className="font-black text-kitchen-muted">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-kitchen-green" style={{ width: `${width}%` }} />
      </div>
    </button>
  );
}

function DashboardDetailSheet({
  detail,
  onClose,
  onUsed,
  onShopping,
  onEdit,
}: {
  detail: DetailView | null;
  onClose: () => void;
  onUsed: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
}) {
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-3">
      <Card className="max-h-[82vh] w-full overflow-y-auto p-4">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-start justify-between gap-3 bg-white/95 p-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-kitchen-ink">{detail.title}</h2>
            <p className="mt-0.5 text-sm font-semibold text-kitchen-muted">
              {detail.items.length} item{detail.items.length === 1 ? "" : "s"} · {detail.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100"
            aria-label="Close detail"
          >
            <X size={18} />
          </button>
        </div>

        {detail.items.length ? (
          <div className="mt-3 space-y-2">
            {detail.items.map((item) => {
              const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);
              return (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-kitchen-ink">{item.name}</p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-kitchen-muted">
                        {item.quantity} {item.unit} · {item.location}
                        {item.category ? ` · ${item.category}` : ""}
                      </p>
                    </div>
                    <Badge className={`shrink-0 px-2 py-0.5 text-[10px] ${expiryTone(status)}`}>
                      {relativeExpiryLabel(item.expiryDate, item.hasNoExpiry)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Button
                      variant="secondary"
                      className="min-h-8 rounded-xl px-2 text-xs"
                      onClick={() => onUsed(item)}
                    >
                      Used
                    </Button>
                    <Button
                      variant="secondary"
                      className="min-h-8 rounded-xl px-2 text-xs"
                      onClick={() => onShopping(item)}
                    >
                      Shop
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-8 rounded-xl px-2 text-xs"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm font-bold text-kitchen-ink">No matching items.</p>
            <p className="mt-1 text-xs font-semibold text-kitchen-muted">
              Add stock and it will appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
