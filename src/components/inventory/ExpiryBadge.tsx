import type { ExpiryStatus } from "../../types/inventory";

const LABELS: Record<ExpiryStatus, string> = {
  unknown: "Unknown expiry",
  fresh: "Fresh",
  expiringSoon: "Expiring soon",
  expired: "Expired",
};

const STYLES: Record<ExpiryStatus, string> = {
  unknown: "bg-stone-100 text-stone-600",
  fresh: "bg-sage text-moss",
  expiringSoon: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-700",
};

export function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
