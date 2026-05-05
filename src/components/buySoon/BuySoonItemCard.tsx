import type { BuySoonItem } from "../../services/buySoonService";

interface BuySoonItemCardProps {
  item: BuySoonItem;
  selected: boolean;
  onToggle: (templateId: string) => void;
}

export function BuySoonItemCard({ item, selected, onToggle }: BuySoonItemCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.templateId)}
      className={[
        "tap-target w-full rounded-2xl border p-4 text-left shadow-soft transition",
        selected ? "border-moss bg-sage" : "border-stone-200 bg-white/90",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
            selected ? "border-moss bg-moss" : "border-stone-300 bg-white",
          ].join(" ")}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-ink">{item.displayName}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">{item.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
              {item.currentSummary}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
              {item.desiredSummary}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
