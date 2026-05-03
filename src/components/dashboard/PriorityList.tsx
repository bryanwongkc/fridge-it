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
  onSelect,
}: {
  items: InventoryItem[];
  onUsed: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onSelect?: (item: InventoryItem) => void;
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
    <div className="space-y-2">
      {items.map((item) => {
        const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);
        return (
          <Card
            key={item.id}
            className={`p-3 ${onSelect ? "cursor-pointer transition active:scale-[0.99]" : ""}`}
            onClick={() => onSelect?.(item)}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={(event) => {
              if (!onSelect) return;
              if (event.key === "Enter" || event.key === " ") onSelect(item);
            }}
          >
            <div className="flex gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-100"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-base font-black text-kitchen-green">
                  {item.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-kitchen-ink">{item.name}</h3>
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
                    className="min-h-9 rounded-xl px-2 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      onUsed(item);
                    }}
                  >
                    Used
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-9 rounded-xl px-2 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      onShopping(item);
                    }}
                  >
                    Shop
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 rounded-xl px-2 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(item);
                    }}
                  >
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
