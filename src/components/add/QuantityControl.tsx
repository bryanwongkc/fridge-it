import { Minus, Plus } from "lucide-react";
import type { PercentageValue, QuantityMode, Unit } from "../../types/inventory";
import { PERCENTAGE_OPTIONS, UNIT_OPTIONS } from "../../utils/constants";

interface QuantityControlProps {
  mode: QuantityMode;
  percentage: PercentageValue;
  quantity: number;
  unit: Unit;
  onModeChange: (value: QuantityMode) => void;
  onPercentageChange: (value: PercentageValue) => void;
  onQuantityChange: (value: number) => void;
  onUnitChange: (value: Unit) => void;
}

export function QuantityControl({
  mode,
  percentage,
  quantity,
  unit,
  onModeChange,
  onPercentageChange,
  onQuantityChange,
  onUnitChange,
}: QuantityControlProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
        {(["percentage", "count"] as QuantityMode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onModeChange(option)}
            className={[
              "tap-target rounded-xl text-sm font-semibold capitalize",
              option === mode ? "bg-white text-ink shadow-sm" : "text-stone-500",
            ].join(" ")}
          >
            {option}
          </button>
        ))}
      </div>

      {mode === "percentage" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {PERCENTAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPercentageChange(option.value)}
              className={[
                "tap-target rounded-full px-4 text-sm font-semibold",
                option.value === percentage
                  ? "bg-moss text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-[44px_1fr_44px] gap-2">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              className="flex h-12 items-center justify-center rounded-2xl bg-white text-ink ring-1 ring-stone-200"
              aria-label="Decrease quantity"
            >
              <Minus className="h-5 w-5" />
            </button>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => onQuantityChange(Number(event.target.value))}
              className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-center text-base font-semibold outline-none focus:border-moss focus:bg-white"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex h-12 items-center justify-center rounded-2xl bg-white text-ink ring-1 ring-stone-200"
              aria-label="Increase quantity"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <select
            value={unit}
            onChange={(event) => onUnitChange(event.target.value as Unit)}
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
          >
            {UNIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
