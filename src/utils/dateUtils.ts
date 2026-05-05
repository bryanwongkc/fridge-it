export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateString(): string {
  return toDateOnly(new Date());
}

export function todayDateOnly(): string {
  return todayDateString();
}

export function addDaysDateString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

export function addDaysDateOnly(days: number): string {
  return addDaysDateString(days);
}

export function expiryPresetToDate(preset: string): string | null {
  switch (preset) {
    case "today":
      return todayDateString();
    case "tomorrow":
      return addDaysDateString(1);
    case "3_days":
      return addDaysDateString(3);
    case "1_week":
      return addDaysDateString(7);
    case "2_weeks":
      return addDaysDateString(14);
    case "1_month":
      return addDaysDateString(30);
    case "3_months":
      return addDaysDateString(90);
    case "unknown":
    case "custom":
    default:
      return null;
  }
}

export function expiryPresetToDays(preset: string): number | null {
  switch (preset) {
    case "today":
      return 0;
    case "tomorrow":
      return 1;
    case "3_days":
      return 3;
    case "1_week":
      return 7;
    case "2_weeks":
      return 14;
    case "1_month":
      return 30;
    case "3_months":
      return 90;
    default:
      return null;
  }
}

function dateOnlyToUtc(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calculateExpiryStatus(input: {
  expiryKnown?: boolean;
  expiryDate?: string | null;
}): "unknown" | "fresh" | "expiringSoon" | "expired" {
  if (input.expiryKnown === false || !input.expiryDate) {
    return "unknown";
  }

  const today = dateOnlyToUtc(todayDateString());
  const expiry = dateOnlyToUtc(input.expiryDate);
  const daysUntilExpiry = Math.floor((expiry - today) / 86_400_000);

  if (daysUntilExpiry < 0) {
    return "expired";
  }

  if (daysUntilExpiry <= 3) {
    return "expiringSoon";
  }

  return "fresh";
}
