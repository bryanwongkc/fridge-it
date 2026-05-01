import { Trash2 } from "lucide-react";
import type { ShoppingItem } from "../../types/shopping";

export function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 shadow-soft ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => onToggle(item)}
        className={`h-6 w-6 rounded-lg border-2 ${
          item.checked ? "border-kitchen-green bg-kitchen-green" : "border-slate-300"
        }`}
        aria-label={item.checked ? "Uncheck item" : "Check item"}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${item.checked ? "text-slate-400 line-through" : "text-kitchen-ink"}`}>
          {item.name}
        </p>
        {item.quantity || item.unit ? (
          <p className="text-xs text-kitchen-muted">
            {item.quantity ?? ""} {item.unit ?? ""}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDelete(item)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400"
        aria-label="Delete shopping item"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
