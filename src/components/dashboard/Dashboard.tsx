import { Plus } from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import { getDaysUntilExpiry } from "../../utils/dates";
import { getExpiryStatus } from "../../utils/expiry";
import { Button } from "../common/Button";
import { LoadingState } from "../common/LoadingState";
import { ExpirySummaryCards } from "./ExpirySummaryCards";
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
  const priorityItems = [...items]
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

  const useFirst = priorityItems.length ? priorityItems : items.slice(0, 5);

  return (
    <section className="space-y-6 pb-4">
      <div className="rounded-[2rem] bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-kitchen-muted">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-normal text-kitchen-ink">
              Use first
            </h1>
            <p className="mt-1 text-sm text-kitchen-muted">{householdId} stock priority</p>
          </div>
          <Button onClick={onAddStock} icon={<Plus size={18} />} className="shrink-0">
            Add
          </Button>
        </div>
      </div>

      <ExpirySummaryCards summary={summary} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-kitchen-ink">Today’s Priority</h2>
          <span className="text-sm font-semibold text-kitchen-muted">{useFirst.length} items</span>
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
