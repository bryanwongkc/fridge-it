import { Star } from "lucide-react";
import type { HouseholdItemTemplate } from "../../types/library";
import { LOCATION_LABELS } from "../../utils/constants";

interface RecentItemsSectionProps {
  templates: HouseholdItemTemplate[];
  onSelect: (template: HouseholdItemTemplate) => void;
}

export function RecentItemsSection({ templates, onSelect }: RecentItemsSectionProps) {
  const visibleTemplates = templates.slice(0, 8);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-ink">Use this again</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">Same as last time, then adjust only if needed.</p>
      </div>

      {visibleTemplates.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white/85 p-4 text-sm leading-6 text-stone-600 shadow-soft">
          Items you add will appear here for faster reuse.
        </div>
      ) : (
        <div className="grid gap-2">
          {visibleTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="tap-target rounded-2xl border border-stone-200 bg-white/90 p-4 text-left shadow-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-ink">{template.displayName}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {LOCATION_LABELS[template.defaultLocation]} / {template.quantityMode ?? "percentage"}
                  </p>
                </div>
                {template.favorite ? (
                  <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
                ) : (
                  <span className="shrink-0 rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">
                    Same
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
