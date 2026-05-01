export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getTodayISO(): string {
  return formatDate(new Date());
}

export function displayDate(iso: string | null): string {
  if (!iso) return "No expiry";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function relativeExpiryLabel(iso: string | null, hasNoExpiry = false): string {
  if (hasNoExpiry || !iso) return "No expiry";
  const days = getDaysUntilExpiry(iso);
  if (days < 0) return `${Math.abs(days)}d expired`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days}d`;
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date(`${getTodayISO()}T00:00:00`);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}
