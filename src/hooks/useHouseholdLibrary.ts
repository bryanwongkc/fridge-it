import { useCallback, useEffect, useMemo, useState } from "react";
import {
  attachBarcodeToTemplate,
  createOrUpdateTemplateFromInventoryItem,
  setTemplateFavorite,
  subscribeHouseholdLibrary,
  updateTemplate,
} from "../services/libraryService";
import type { HouseholdItemTemplate, TemplateDefaultsInput, UpdateTemplateInput } from "../types/library";
import { useActiveHousehold } from "./useActiveHousehold";

export function sortTemplatesForReuse(templates: HouseholdItemTemplate[]) {
  return [...templates].sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1;
    }
    const aLast = a.lastUsedAt?.toMillis?.() ?? 0;
    const bLast = b.lastUsedAt?.toMillis?.() ?? 0;
    if (aLast !== bLast) {
      return bLast - aLast;
    }
    return b.useCount - a.useCount;
  });
}

export function useHouseholdLibrary() {
  const { activeHouseholdId } = useActiveHousehold();
  const [templates, setTemplates] = useState<HouseholdItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeHouseholdId) {
      setTemplates([]);
      setLoading(false);
      return () => undefined;
    }

    setLoading(true);
    setError(null);
    return subscribeHouseholdLibrary(activeHouseholdId, (nextTemplates) => {
      setTemplates(nextTemplates);
      setLoading(false);
    });
  }, [activeHouseholdId]);

  const sortedTemplates = useMemo(() => sortTemplatesForReuse(templates), [templates]);

  const requireHousehold = useCallback(() => {
    if (!activeHouseholdId) {
      throw new Error("Choose a household first.");
    }
    return activeHouseholdId;
  }, [activeHouseholdId]);

  return {
    templates,
    sortedTemplates,
    loading,
    error,
    upsertFromInventoryItem: useCallback(
      async (input: Omit<TemplateDefaultsInput, "householdId">) => {
        setError(null);
        return createOrUpdateTemplateFromInventoryItem({
          ...input,
          householdId: requireHousehold(),
        });
      },
      [requireHousehold],
    ),
    updateTemplateDefaults: useCallback(
      async (templateId: string, input: UpdateTemplateInput) => {
        setError(null);
        await updateTemplate(requireHousehold(), templateId, input);
      },
      [requireHousehold],
    ),
    favoriteTemplate: useCallback(
      async (templateId: string, favorite: boolean) => {
        setError(null);
        await setTemplateFavorite(requireHousehold(), templateId, favorite);
      },
      [requireHousehold],
    ),
    attachBarcode: useCallback(
      async (templateId: string, barcode: string) => {
        setError(null);
        await attachBarcodeToTemplate(requireHousehold(), templateId, barcode);
      },
      [requireHousehold],
    ),
  };
}
