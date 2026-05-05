import { Trash2 } from "lucide-react";
import type { GroceryListItem } from "../../types/grocery";

interface GroceryItemCardProps {
  item: GroceryListItem;
  onCheckedChange: (itemId: string, checked: boolean) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export function GroceryItemCard({ item, onCheckedChange, onDelete }: GroceryItemCardProps) {
  return (
    <article
      className={[
        "rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft",
        item.checked ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={(event) => void onCheckedChange(item.id, event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-moss"
          aria-label={`Mark ${item.name} as ${item.checked ? "not bought" : "bought"}`}
        />
        <div className="min-w-0 flex-1">
          <h2 className={["text-base font-bold text-ink", item.checked ? "line-through" : ""].join(" ")}>
            {item.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeof item.quantity === "number" ? (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                {item.quantity} {item.unit ?? "item"}
              </span>
            ) : null}
            {item.source === "buy_soon" ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Buy Soon
              </span>
            ) : (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                Manual
              </span>
            )}
          </div>
          {item.reason ? <p className="mt-2 text-sm leading-6 text-stone-500">{item.reason}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void onDelete(item.id)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
