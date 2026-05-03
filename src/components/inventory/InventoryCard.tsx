import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
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
  onDelete,
}: {
  item: InventoryItem;
  onUsed: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem, delta: number) => void;
  onDelete: (item: InventoryItem) => void;
}) {
  const status = getExpiryStatus(item.expiryDate, item.hasNoExpiry);

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-base font-black text-kitchen-green">
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

          <div className="mt-2 flex items-center gap-2">
            {item.quantity > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => onAdjust(item, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100"
                  aria-label="Reduce quantity"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onAdjust(item, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </>
            ) : null}
            <div className="grid min-w-0 flex-1 grid-cols-4 gap-2">
              <Button
                variant="secondary"
                className="min-h-8 rounded-xl px-2 text-xs"
                onClick={() => onUsed(item)}
              >
                Used
              </Button>
              <Button
                variant="ghost"
                className="min-h-8 rounded-xl px-2 text-xs"
                onClick={() => onEdit(item)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                className="min-h-8 rounded-xl px-2 text-xs"
                icon={<ShoppingBasket size={14} />}
                onClick={() => onShopping(item)}
              >
                Add
              </Button>
              <Button
                variant="ghost"
                className="min-h-8 rounded-xl px-2 text-xs text-red-600"
                icon={<Trash2 size={14} />}
                onClick={() => onDelete(item)}
                aria-label={`Delete ${item.name}`}
              >
                Del
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
