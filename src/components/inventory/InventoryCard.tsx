import { Minus, Plus, ShoppingBasket } from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import { relativeExpiryLabel } from "../../utils/dates";
import { expiryTone, getExpiryStatus } from "../../utils/expiry";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

export function InventoryCard({
  item,
  onUsed,
  onEdit,
  onShopping,
  onAdjust,
}: {
  item: InventoryItem;
  onUsed: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem, delta: number) => void;
}) {
  const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-kitchen-green">
            {item.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-kitchen-ink">{item.name}</h3>
              <p className="mt-1 text-sm text-kitchen-muted">
                {item.quantity} {item.unit} · {item.location}
              </p>
            </div>
            <Badge className={expiryTone(status)}>
              {relativeExpiryLabel(item.expiryDate, item.hasNoExpiry)}
            </Badge>
          </div>

          {item.quantity > 1 ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAdjust(item, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100"
                aria-label="Reduce quantity"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => onAdjust(item, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
              <span className="text-xs font-semibold text-kitchen-muted">Adjust stock</span>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button variant="secondary" className="min-h-10 px-2" onClick={() => onUsed(item)}>
              Used
            </Button>
            <Button variant="ghost" className="min-h-10 px-2" onClick={() => onEdit(item)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              className="min-h-10 px-2"
              icon={<ShoppingBasket size={15} />}
              onClick={() => onShopping(item)}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
