import type { InventoryItem } from "../types/inventory";
import type { HouseholdItemTemplate } from "../types/library";

export interface BuySoonItem {
  templateId: string;
  displayName: string;
  normalizedName: string;
  reason: string;
  currentSummary: string;
  desiredSummary: string;
  suggestedQuantity?: number;
  unit?: string;
}

function matchesTemplate(item: InventoryItem, template: HouseholdItemTemplate): boolean {
  return item.templateId === template.id || item.normalizedName === template.normalizedName;
}

export function calculateBuySoonItems(
  householdTemplates: HouseholdItemTemplate[],
  activeInventoryItems: InventoryItem[],
): BuySoonItem[] {
  return householdTemplates
    .filter((template) => template.desiredStockEnabled)
    .flatMap((template): BuySoonItem[] => {
      const matchingItems = activeInventoryItems.filter((item) => matchesTemplate(item, template));
      const mode = template.quantityMode ?? template.defaultQuantityMode ?? "percentage";

      if (mode === "count") {
        const desired = template.desiredMinQuantity ?? 1;
        const current = matchingItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
        const unit = template.defaultUnit ?? matchingItems[0]?.unit ?? "pcs";

        if (matchingItems.length === 0) {
          return [
            {
              templateId: template.id,
              displayName: template.displayName,
              normalizedName: template.normalizedName,
              reason: "None currently in stock.",
              currentSummary: "0 in stock",
              desiredSummary: `Desired minimum is ${desired} ${unit}.`,
              suggestedQuantity: Math.max(desired, template.defaultQuantity ?? desired),
              unit,
            },
          ];
        }

        if (current < desired) {
          return [
            {
              templateId: template.id,
              displayName: template.displayName,
              normalizedName: template.normalizedName,
              reason: `Only ${current} ${unit} left. Desired minimum is ${desired}.`,
              currentSummary: `${current} ${unit} left`,
              desiredSummary: `Minimum ${desired} ${unit}`,
              suggestedQuantity: Math.max(desired - current, 1),
              unit,
            },
          ];
        }

        return [];
      }

      const desired = template.desiredMinPercentage ?? 25;
      if (matchingItems.length === 0) {
        return [
          {
            templateId: template.id,
            displayName: template.displayName,
            normalizedName: template.normalizedName,
            reason: "None currently in stock.",
            currentSummary: "No open item",
            desiredSummary: `Desired minimum is ${desired}%.`,
            suggestedQuantity: 1,
            unit: "item",
          },
        ];
      }

      const lowest = Math.min(
        ...matchingItems.map((item) => (typeof item.percentage === "number" ? item.percentage : 100)),
      );

      if (lowest <= desired) {
        return [
          {
            templateId: template.id,
            displayName: template.displayName,
            normalizedName: template.normalizedName,
            reason: `Almost finished. Desired minimum is ${desired}%.`,
            currentSummary: `${lowest}% remaining`,
            desiredSummary: `Minimum ${desired}%`,
            suggestedQuantity: 1,
            unit: "item",
          },
        ];
      }

      return [];
    });
}
