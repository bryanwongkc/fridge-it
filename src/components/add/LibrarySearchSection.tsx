import { useMemo, useState } from "react";
import type { HouseholdItemTemplate } from "../../types/library";
import { LOCATION_LABELS } from "../../utils/constants";

interface LibrarySearchSectionProps {
  templates: HouseholdItemTemplate[];
  onSelect: (template: HouseholdItemTemplate) => void;
}

export function LibrarySearchSection({ templates, onSelect }: LibrarySearchSectionProps) {
  const [search, setSearch] = useState("");
  const results = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return [];
    }
    return templates
      .filter(
        (template) =>
          template.displayName.toLowerCase().includes(normalizedSearch) ||
          template.normalizedName.includes(normalizedSearch),
      )
      .slice(0, 6);
  }, [search, templates]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-ink">Search household library</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">Find something the household already knows.</p>
      </div>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search saved items"
        className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base outline-none focus:border-moss"
      />
      {results.length > 0 ? (
        <div className="grid gap-2">
          {results.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="tap-target rounded-2xl bg-white px-4 text-left text-sm font-semibold text-ink ring-1 ring-stone-200"
            >
              {template.displayName}
              <span className="ml-2 font-normal text-stone-500">
                {LOCATION_LABELS[template.defaultLocation]}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
