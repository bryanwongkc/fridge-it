import type { ExpiryPreset } from "../../types/inventory";

interface ExpiryPresetChipsProps {
  value: ExpiryPreset;
  onChange: (value: ExpiryPreset) => void;
}

const presets: Array<{ value: ExpiryPreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "3_days", label: "3 days" },
  { value: "1_week", label: "1 week" },
  { value: "2_weeks", label: "2 weeks" },
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "unknown", label: "No expiry" },
  { value: "custom", label: "Custom" },
];

export function ExpiryPresetChips({ value, onChange }: ExpiryPresetChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onChange(preset.value)}
          className={[
            "tap-target rounded-full px-4 text-sm font-semibold",
            value === preset.value
              ? "bg-ink text-white"
              : "bg-white text-stone-600 ring-1 ring-stone-200",
          ].join(" ")}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
