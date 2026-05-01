import type { InventoryItem } from "../../types/inventory";
import { relativeExpiryLabel } from "../../utils/dates";
import { expiryTone, getExpiryStatus } from "../../utils/expiry";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";

export function PriorityList({
  items,
  onUsed,
  onShopping,
  onEdit,
}: {
  items: InventoryItem[];
  onUsed: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="Your fridge is empty."
        body="Add your first item to start tracking expiry."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);
        return (
          <Card key={item.id} className="p-4">
            <div className="flex gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-100"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-black text-kitchen-green">
                  {item.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-kitchen-ink">{item.name}</h3>
                    <p className="mt-0.5 text-sm text-kitchen-muted">
                      {item.quantity} {item.unit} · {item.location}
                    </p>
                  </div>
                  <Badge className={expiryTone(status)}>
                    {relativeExpiryLabel(item.expiryDate, item.hasNoExpiry)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button variant="secondary" className="min-h-10 px-2" onClick={() => onUsed(item)}>
                    Used
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-10 px-2"
                    onClick={() => onShopping(item)}
                  >
                    Shopping
                  </Button>
                  <Button variant="ghost" className="min-h-10 px-2" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
