import { Barcode, Pencil, Star } from "lucide-react";
import type { HouseholdItemTemplate } from "../../types/library";
import { LOCATION_LABELS } from "../../utils/constants";

interface TemplateCardProps {
  template: HouseholdItemTemplate;
  onEdit: (template: HouseholdItemTemplate) => void;
  onFavorite: (templateId: string, favorite: boolean) => Promise<void>;
}

export function TemplateCard({ template, onEdit, onFavorite }: TemplateCardProps) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-ink">{template.displayName}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {LOCATION_LABELS[template.defaultLocation]} / {template.quantityMode ?? "percentage"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onFavorite(template.id, !template.favorite)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100"
          aria-label={template.favorite ? "Remove favorite" : "Favorite template"}
        >
          <Star
            className={[
              "h-5 w-5",
              template.favorite ? "fill-amber-400 text-amber-400" : "text-stone-500",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">
          Used {template.useCount}
        </span>
        {template.expiryPreset ? (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
            {template.expiryPreset === "unknown" ? "No expiry" : template.expiryPreset}
          </span>
        ) : null}
        {template.desiredStockEnabled ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Desired stock
          </span>
        ) : null}
        {template.barcodes.length ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
            <Barcode className="h-3.5 w-3.5" />
            {template.barcodes.length}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onEdit(template)}
        className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
      >
        <Pencil className="h-4 w-4" />
        Edit defaults
      </button>
    </article>
  );
}
