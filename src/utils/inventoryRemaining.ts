import type { InventoryItem } from "../types/inventory";

const pieceUnits = new Set(["pc", "pcs", "piece", "pieces"]);

export function isPieceUnit(unit: string) {
  return pieceUnits.has(unit.trim().toLowerCase());
}

export function remainingPercent(item: Pick<InventoryItem, "remainingPercent">) {
  return Math.max(0, Math.min(100, item.remainingPercent ?? 100));
}

export function remainingLabel(item: Pick<InventoryItem, "quantity" | "unit" | "remainingPercent">) {
  if (isPieceUnit(item.unit)) {
    return `${item.quantity} ${item.unit} remain`;
  }

  return `${remainingPercent(item)}% remain`;
}
