import type { InventoryItem } from "../../types/inventory";

export function QuantityBadge({ item }: { item: InventoryItem }) {
  let label = "Quantity skipped";

  if (item.quantityMode === "percentage" && typeof item.percentage === "number") {
    label = `${item.percentage}%`;
  }

  if (item.quantityMode === "count" && typeof item.quantity === "number") {
    label = `${item.quantity} ${item.unit ?? "item"}`;
  }

  return (
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
      {label}
    </span>
  );
}
