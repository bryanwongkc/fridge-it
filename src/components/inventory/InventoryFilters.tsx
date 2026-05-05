import type { ExpiryStatus } from "../../types/inventory";
import type { HouseholdLocation } from "../../types/household";
import { LOCATION_LABELS } from "../../utils/constants";

export type LocationFilter = "all" | HouseholdLocation;
export type StatusFilter = "all" | ExpiryStatus;

interface InventoryFiltersProps {
  search: string;
  locationFilter: LocationFilter;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onLocationFilterChange: (value: LocationFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}

const locationOptions: LocationFilter[] = ["all", "fridge", "freezer", "pantry", "other"];

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "expired", label: "Expired" },
  { value: "expiringSoon", label: "Expiring Soon" },
  { value: "unknown", label: "Unknown Expiry" },
  { value: "fresh", label: "Fresh" },
];

export function InventoryFilters({
  search,
  locationFilter,
  statusFilter,
  onSearchChange,
  onLocationFilterChange,
  onStatusFilterChange,
}: InventoryFiltersProps) {
  return (
    <section className="space-y-4">
      <label className="block">
        <span className="sr-only">Search inventory</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search inventory"
          className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-moss"
        />
      </label>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {locationOptions.map((option) => {
            const active = option === locationFilter;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onLocationFilterChange(option)}
                className={[
                  "tap-target rounded-full px-4 text-sm font-semibold transition",
                  active ? "bg-moss text-white" : "bg-white text-stone-600 ring-1 ring-stone-200",
                ].join(" ")}
              >
                {option === "all" ? "All" : LOCATION_LABELS[option]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const active = option.value === statusFilter;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onStatusFilterChange(option.value)}
                className={[
                  "tap-target rounded-full px-4 text-sm font-semibold transition",
                  active ? "bg-ink text-white" : "bg-white text-stone-600 ring-1 ring-stone-200",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
