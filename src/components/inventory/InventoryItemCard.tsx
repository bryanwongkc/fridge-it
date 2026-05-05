import { Barcode, CalendarPlus, MoreHorizontal, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import type { InventoryItemWithExpiry } from "../../hooks/useInventory";
import { LOCATION_LABELS } from "../../utils/constants";
import { ExpiryBadge } from "./ExpiryBadge";
import { QuantityBadge } from "./QuantityBadge";

interface InventoryItemCardProps {
  item: InventoryItemWithExpiry;
  onActions: (item: InventoryItemWithExpiry) => void;
  onConsumed: (itemId: string) => Promise<void>;
  onDiscarded: (itemId: string) => Promise<void>;
  onKeep: (itemId: string) => Promise<void>;
  onExtend: (itemId: string) => Promise<void>;
}

export function InventoryItemCard({
  item,
  onActions,
  onConsumed,
  onDiscarded,
  onKeep,
  onExtend,
}: InventoryItemCardProps) {
  const canExtend = item.expiryStatus === "expired" || item.expiryStatus === "expiringSoon";

  return (
    <article className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
              {LOCATION_LABELS[item.location]}
            </span>
            <ExpiryBadge status={item.expiryStatus} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-ink">{item.name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <QuantityBadge item={item} />
            {item.expiryDate ? (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                {item.expiryDate}
              </span>
            ) : null}
            {item.barcode ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
                <Barcode className="h-3.5 w-3.5" />
                {item.barcode}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onActions(item)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600"
          aria-label={`More actions for ${item.name}`}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void onConsumed(item.id)}
          className="tap-target rounded-xl bg-sage px-3 text-sm font-semibold text-moss"
        >
          Consumed
        </button>
        <button
          type="button"
          onClick={() => void onDiscarded(item.id)}
          className="tap-target rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-700"
        >
          Discarded
        </button>
        {canExtend ? (
          <button
            type="button"
            onClick={() => void onExtend(item.id)}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-ink ring-1 ring-stone-200"
          >
            <CalendarPlus className="h-4 w-4" />
            Extend
          </button>
        ) : null}
        {item.expiryStatus === "expired" ? (
          <button
            type="button"
            onClick={() => void onKeep(item.id)}
            className="tap-target rounded-xl bg-white px-3 text-sm font-semibold text-ink ring-1 ring-stone-200"
          >
            Keep
          </button>
        ) : null}
        <Link
          to={`/item/${item.id}`}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-3 text-sm font-semibold text-ink"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </div>
    </article>
  );
}
