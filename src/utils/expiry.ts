import { getDaysUntilExpiry } from "./dates";

export type ExpiryStatus =
  | "no_expiry"
  | "expired"
  | "today"
  | "tomorrow"
  | "soon_3_days"
  | "this_week"
  | "safe";

export function getExpiryStatus(
  expiryDate: string | null,
  hasNoExpiry: boolean,
): ExpiryStatus {
  if (hasNoExpiry || !expiryDate) return "no_expiry";
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return "expired";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 3) return "soon_3_days";
  if (days <= 7) return "this_week";
  return "safe";
}

export function expiryTone(status: ExpiryStatus): string {
  switch (status) {
    case "expired":
      return "bg-red-50 text-red-700";
    case "today":
      return "bg-orange-50 text-orange-700";
    case "tomorrow":
    case "soon_3_days":
      return "bg-amber-50 text-amber-700";
    case "this_week":
      return "bg-yellow-50 text-yellow-700";
    case "no_expiry":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}
