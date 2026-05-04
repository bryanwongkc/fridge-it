import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import { isPieceUnit, remainingPercent } from "../../utils/inventoryRemaining";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

export function UsedAdjustSheet({
  item,
  onClose,
  onSave,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (
    item: InventoryItem,
    fields: Partial<Pick<InventoryItem, "quantity" | "remainingPercent" | "status">>,
    allUsed: boolean,
  ) => Promise<void>;
}) {
  const [remaining, setRemaining] = useState(100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setRemaining(isPieceUnit(item.unit) ? item.quantity : remainingPercent(item));
  }, [item]);

  if (!item) return null;

  const usesPieces = isPieceUnit(item.unit);
  const max = usesPieces ? Math.max(1, Math.round(item.quantity)) : 100;
  const value = Math.max(0, Math.min(max, Math.round(remaining)));
  const label = usesPieces ? `${value} ${item.unit} left` : `${value}% left`;

  const save = async (allUsed: boolean) => {
    setSaving(true);
    try {
      if (allUsed || value === 0) {
        await onSave(
          item,
          usesPieces ? { quantity: 0, status: "used" } : { remainingPercent: 0, status: "used" },
          true,
        );
        return;
      }

      await onSave(
        item,
        usesPieces ? { quantity: value } : { remainingPercent: value },
        false,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-3">
      <Card className="w-full space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-kitchen-ink">Update remaining</h2>
            <p className="mt-0.5 truncate text-sm font-semibold text-kitchen-muted">{item.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100"
            aria-label="Close used adjustment"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-bold text-kitchen-muted">Remaining</span>
            <span className="text-2xl font-black text-kitchen-ink">{label}</span>
          </div>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={value}
            onChange={(event) => setRemaining(Number(event.target.value))}
            className="mt-4 w-full accent-kitchen-green"
          />
          <div className="mt-2 flex justify-between text-xs font-bold text-kitchen-muted">
            <span>0</span>
            <span>{usesPieces ? `${max} ${item.unit}` : "100%"}</span>
          </div>
        </div>

        <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
          <Button
            type="button"
            variant="danger"
            disabled={saving}
            onClick={() => void save(true)}
          >
            All used
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void save(false)}
          >
            {saving ? "Saving..." : "Save remaining"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
