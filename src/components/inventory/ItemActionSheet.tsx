import { CalendarPlus, Check, Pencil, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { InventoryItemWithExpiry } from "../../hooks/useInventory";
import { addDaysDateString } from "../../utils/dateUtils";

interface ItemActionSheetProps {
  item: InventoryItemWithExpiry | null;
  onClose: () => void;
  onConsumed: (itemId: string) => Promise<void>;
  onDiscarded: (itemId: string) => Promise<void>;
  onKeep: (itemId: string) => Promise<void>;
  onExtend: (itemId: string, expiryDate: string) => Promise<void>;
}

export function ItemActionSheet({
  item,
  onClose,
  onConsumed,
  onDiscarded,
  onKeep,
  onExtend,
}: ItemActionSheetProps) {
  if (!item) {
    return null;
  }

  const canExtend = item.expiryStatus === "expired" || item.expiryStatus === "expiringSoon";

  async function handleAction(action: () => Promise<void>) {
    await action();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/30 px-4 pb-4 pt-24" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-xl rounded-[1.5rem] bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss">Item actions</p>
            <h2 className="mt-1 truncate text-xl font-bold text-ink">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600"
            aria-label="Close actions"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={() => void handleAction(() => onConsumed(item.id))}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
          >
            <Check className="h-4 w-4" />
            Consumed
          </button>
          <button
            type="button"
            onClick={() => void handleAction(() => onDiscarded(item.id))}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-red-700 ring-1 ring-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Discarded
          </button>
          {canExtend ? (
            <button
              type="button"
              onClick={() => void handleAction(() => onExtend(item.id, addDaysDateString(7)))}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
            >
              <CalendarPlus className="h-4 w-4" />
              Extend 1 week
            </button>
          ) : null}
          {item.expiryStatus === "expired" ? (
            <button
              type="button"
              onClick={() => void handleAction(() => onKeep(item.id))}
              className="tap-target rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
            >
              Keep for now
            </button>
          ) : null}
          <Link
            to={`/item/${item.id}`}
            onClick={onClose}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-100 px-4 text-sm font-semibold text-ink"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
