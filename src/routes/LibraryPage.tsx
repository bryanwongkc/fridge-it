import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { EmptyState } from "../components/layout/EmptyState";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { TemplateCard } from "../components/library/TemplateCard";
import { TemplateEditForm } from "../components/library/TemplateEditForm";
import { useHouseholdLibrary } from "../hooks/useHouseholdLibrary";
import {
  deleteHouseholdBarcodeIndex,
  saveHouseholdBarcodeIndex,
} from "../services/barcodeService";
import { normalizeName } from "../services/normalizationService";
import type { HouseholdItemTemplate, UpdateTemplateInput } from "../types/library";

export function LibraryPage() {
  const {
    sortedTemplates,
    loading,
    updateTemplateDefaults,
    favoriteTemplate,
  } = useHouseholdLibrary();
  const [search, setSearch] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<HouseholdItemTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return sortedTemplates;
    }
    return sortedTemplates.filter(
      (template) =>
        template.displayName.toLowerCase().includes(normalizedSearch) ||
        template.normalizedName.includes(normalizedSearch),
    );
  }, [search, sortedTemplates]);

  async function handleSave(templateId: string, input: UpdateTemplateInput) {
    setBusy(true);
    setError(null);
    try {
      const existingTemplate = editingTemplate;
      await updateTemplateDefaults(templateId, input);
      if (existingTemplate && input.barcodes) {
        const previous = new Set(existingTemplate.barcodes);
        const next = new Set(input.barcodes);
        const indexTemplate = {
          id: existingTemplate.id,
          displayName: input.displayName ?? existingTemplate.displayName,
          normalizedName: input.displayName
            ? normalizeName(input.displayName)
            : existingTemplate.normalizedName,
          category: input.category ?? existingTemplate.category,
          defaultLocation: input.defaultLocation ?? existingTemplate.defaultLocation,
        };

        for (const barcode of next) {
          await saveHouseholdBarcodeIndex(existingTemplate.householdId, barcode, indexTemplate);
        }
        for (const barcode of previous) {
          if (!next.has(barcode)) {
            await deleteHouseholdBarcodeIndex(existingTemplate.householdId, barcode);
          }
        }
      }
      setEditingTemplate(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save template.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFavorite(templateId: string, favorite: boolean) {
    setError(null);
    try {
      await favoriteTemplate(templateId, favorite);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update favorite.");
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-moss">Library</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Household item library</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Defaults saved from Add make repeat stock entry faster.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <label className="block">
        <span className="sr-only">Search library</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search saved items"
          className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base outline-none focus:border-moss"
        />
      </label>

      {sortedTemplates.length === 0 ? (
        <EmptyState
          title="No saved items yet"
          description="Items you add will appear here for faster reuse, favorites, barcode links, and desired stock rules."
          action={
            <div className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-600">
              <BookOpen className="h-4 w-4" />
              Add food to start building memory
            </div>
          }
        />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState title="No templates match" description="Try a shorter search term." />
      ) : (
        <section className="space-y-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={setEditingTemplate}
              onFavorite={handleFavorite}
            />
          ))}
        </section>
      )}

      {editingTemplate ? (
        <TemplateEditForm
          template={editingTemplate}
          busy={busy}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
