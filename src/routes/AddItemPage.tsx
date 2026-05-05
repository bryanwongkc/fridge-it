import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { BarcodeScanner } from "../components/add/BarcodeScanner";
import { LibrarySearchSection } from "../components/add/LibrarySearchSection";
import {
  QuickAddForm,
  type QuickAddFormHandle,
} from "../components/add/QuickAddForm";
import { RecentItemsSection } from "../components/add/RecentItemsSection";
import type { QuickAddDraft, SaveIntent } from "../components/add/addTypes";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useBarcodeLookup } from "../hooks/useBarcodeLookup";
import { useHouseholdLibrary } from "../hooks/useHouseholdLibrary";
import { useInventory } from "../hooks/useInventory";
import { saveHouseholdBarcodeIndex } from "../services/barcodeService";
import { normalizeName } from "../services/normalizationService";
import type { HouseholdItemTemplate } from "../types/library";
import { expiryPresetToDate, expiryPresetToDays } from "../utils/dateUtils";

export function AddItemPage() {
  const navigate = useNavigate();
  const formRef = useRef<QuickAddFormHandle | null>(null);
  const { createItem } = useInventory();
  const { sortedTemplates, loading, upsertFromInventoryItem } = useHouseholdLibrary();
  const { lookupBarcode, loading: barcodeLoading } = useBarcodeLookup();
  const [selectedTemplate, setSelectedTemplate] = useState<HouseholdItemTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const recentTemplates = useMemo(() => sortedTemplates.slice(0, 12), [sortedTemplates]);

  function handleSelectTemplate(template: HouseholdItemTemplate) {
    setSelectedTemplate(template);
    formRef.current?.reset(template);
    setSuccessMessage(`${template.displayName} is ready to add.`);
    window.setTimeout(() => formRef.current?.focusName(), 0);
  }

  async function handleBarcodeLookup(barcode: string) {
    setError(null);
    setSuccessMessage(null);
    const result = await lookupBarcode(barcode);

    if (result.status === "household_template") {
      handleSelectTemplate(result.template);
      formRef.current?.applyBarcode({ barcode: result.barcode });
      setSuccessMessage(result.message);
      return result;
    }

    if (result.status === "household_index") {
      const template = sortedTemplates.find(
        (candidate) => candidate.id === result.indexEntry.templateId,
      );
      if (template) {
        handleSelectTemplate(template);
        formRef.current?.applyBarcode({ barcode: result.barcode });
      } else {
        formRef.current?.applyBarcode({
          barcode: result.barcode,
          name: result.indexEntry.displayName,
          category: result.indexEntry.category,
          location: result.indexEntry.defaultLocation,
        });
      }
      setSuccessMessage(result.message);
      return result;
    }

    if (result.status === "open_food_facts") {
      formRef.current?.applyBarcode({
        barcode: result.barcode,
        name: result.product.displayName,
        category: result.product.category,
      });
      setSuccessMessage(result.message);
      return result;
    }

    if (result.status === "cache") {
      formRef.current?.applyBarcode({
        barcode: result.barcode,
        name: result.cacheEntry.name,
        category: result.cacheEntry.category,
      });
      setSuccessMessage(result.message);
      return result;
    }

    formRef.current?.applyBarcode({ barcode: result.barcode });
    setSuccessMessage(result.message);
    return result;
  }

  async function handleSave(draft: QuickAddDraft, intent: SaveIntent) {
    setBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const expiryDate =
        draft.expiryPreset === "custom"
          ? draft.customExpiryDate
          : expiryPresetToDate(draft.expiryPreset);
      const template = await upsertFromInventoryItem({
        name: draft.name,
        displayName: draft.name,
        category: draft.category,
        defaultLocation: draft.location,
        quantityMode: draft.quantityMode,
        defaultQuantity: draft.quantityMode === "count" ? draft.quantity : undefined,
        defaultUnit: draft.quantityMode === "count" ? draft.unit : undefined,
        defaultPercentageRemaining:
          draft.quantityMode === "percentage" ? draft.percentage : undefined,
        expiryPreset: draft.expiryPreset,
        defaultExpiryDays: expiryPresetToDays(draft.expiryPreset),
        desiredStockEnabled: draft.desiredStockEnabled,
        desiredMinQuantity:
          draft.desiredStockEnabled && draft.quantityMode === "count"
            ? draft.desiredMinQuantity
            : null,
        desiredMinPercentage:
          draft.desiredStockEnabled && draft.quantityMode === "percentage"
            ? draft.desiredMinPercentage
            : null,
        barcodes: draft.barcode ? [draft.barcode] : [],
      });

      await createItem({
        templateId: template.id,
        name: draft.name,
        location: draft.location,
        category: draft.category,
        barcode: draft.barcode || null,
        expiryKnown: draft.expiryPreset !== "unknown",
        expiryPreset: draft.expiryPreset,
        expiryDate,
        quantityMode: draft.quantityMode,
        percentage: draft.quantityMode === "percentage" ? draft.percentage : undefined,
        quantity: draft.quantityMode === "count" ? draft.quantity : undefined,
        unit: draft.quantityMode === "count" ? draft.unit : undefined,
      });

      if (draft.barcode) {
        await saveHouseholdBarcodeIndex(template.householdId, draft.barcode, {
          id: template.id,
          displayName: draft.name,
          normalizedName: normalizeName(draft.name),
          category: draft.category,
          defaultLocation: draft.location,
        });
      }

      if (intent === "save") {
        navigate("/inventory");
        return;
      }

      setSelectedTemplate(null);
      formRef.current?.reset(null);
      setSuccessMessage(`${draft.name} saved. Add another item.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save item.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-moss">Add</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Add food</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Use what you added before, or add something new quickly.
        </p>
      </header>

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-moss">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{successMessage}</p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <RecentItemsSection templates={recentTemplates} onSelect={handleSelectTemplate} />
      <LibrarySearchSection templates={sortedTemplates} onSelect={handleSelectTemplate} />
      <BarcodeScanner loading={barcodeLoading} onLookup={handleBarcodeLookup} />
      <QuickAddForm
        ref={formRef}
        selectedTemplate={selectedTemplate}
        busy={busy}
        onSave={handleSave}
      />
    </div>
  );
}
