import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { ExpiryBadge } from "../components/inventory/ExpiryBadge";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useInventory } from "../hooks/useInventory";
import type {
  ExpiryPreset,
  InventoryStatus,
  PercentageValue,
  QuantityMode,
  Unit,
} from "../types/inventory";
import type { HouseholdLocation } from "../types/household";
import {
  HOUSEHOLD_LOCATIONS,
  LOCATION_LABELS,
  PERCENTAGE_OPTIONS,
  UNIT_OPTIONS,
} from "../utils/constants";
import { calculateExpiryStatus, expiryPresetToDate, todayDateString } from "../utils/dateUtils";

export function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const {
    items,
    loading,
    updateItem,
    softDeleteItem,
    markItemConsumed,
    markItemDiscarded,
    keepItemForNow,
    extendItemExpiry,
  } = useInventory();
  const item = useMemo(() => items.find((candidate) => candidate.id === itemId) ?? null, [itemId, items]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<HouseholdLocation>("fridge");
  const [status, setStatus] = useState<InventoryStatus>("available");
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("unknown");
  const [customExpiryDate, setCustomExpiryDate] = useState(todayDateString());
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("percentage");
  const [percentage, setPercentage] = useState<PercentageValue>(100);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>("item");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }

    setName(item.name);
    setLocation(item.location);
    setStatus(item.status);
    setExpiryPreset(item.expiryPreset ?? (item.expiryKnown ? "custom" : "unknown"));
    setCustomExpiryDate(item.expiryDate ?? todayDateString());
    setQuantityMode(item.quantityMode ?? "percentage");
    setPercentage((item.percentage ?? 100) as PercentageValue);
    setQuantity(item.quantity ?? 1);
    setUnit(item.unit ?? "item");
  }, [item]);

  const expiryDate = useMemo(
    () => (expiryPreset === "custom" ? customExpiryDate : expiryPresetToDate(expiryPreset)),
    [customExpiryDate, expiryPreset],
  );
  const previewExpiryStatus = calculateExpiryStatus({
    expiryKnown: expiryPreset !== "unknown",
    expiryDate,
  });

  if (loading) {
    return <LoadingScreen />;
  }

  if (!item) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <h1 className="text-xl font-bold text-ink">Item not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          This item may have been deleted or belongs to another household.
        </p>
        <Link
          to="/inventory"
          className="tap-target mt-5 inline-flex items-center justify-center rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
        >
          Back to inventory
        </Link>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!itemId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateItem(itemId, {
        name,
        location,
        status,
        expiryKnown: expiryPreset !== "unknown",
        expiryPreset,
        expiryDate,
        quantityMode,
        percentage: quantityMode === "percentage" ? percentage : null,
        quantity: quantityMode === "count" ? quantity : null,
        unit: quantityMode === "count" ? unit : null,
      });
      navigate("/inventory");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save item.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!itemId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await softDeleteItem(itemId);
      navigate("/inventory");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <header className="flex items-start gap-3">
        <Link
          to="/inventory"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-stone-600 ring-1 ring-stone-200"
          aria-label="Back to inventory"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-moss">Edit item</p>
          <h1 className="mt-1 truncate text-2xl font-bold text-ink">{item.name}</h1>
        </div>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
          />
        </label>

        <div className="mt-5">
          <p className="text-sm font-semibold text-stone-700">Location</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HOUSEHOLD_LOCATIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocation(option)}
                className={[
                  "tap-target rounded-full px-4 text-sm font-semibold",
                  option === location
                    ? "bg-moss text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200",
                ].join(" ")}
              >
                {LOCATION_LABELS[option]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-stone-700">Expiry</p>
          <ExpiryBadge status={previewExpiryStatus} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["unknown", "No expiry"],
            ["today", "Today"],
            ["tomorrow", "Tomorrow"],
            ["3_days", "3 days"],
            ["1_week", "1 week"],
            ["2_weeks", "2 weeks"],
            ["custom", "Custom date"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setExpiryPreset(value as ExpiryPreset)}
              className={[
                "tap-target rounded-full px-4 text-sm font-semibold",
                value === expiryPreset
                  ? "bg-ink text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        {expiryPreset === "custom" ? (
          <input
            type="date"
            value={customExpiryDate}
            onChange={(event) => setCustomExpiryDate(event.target.value)}
            className="mt-4 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
          />
        ) : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <p className="text-sm font-semibold text-stone-700">Quantity</p>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
          {(["percentage", "count"] as QuantityMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setQuantityMode(option)}
              className={[
                "tap-target rounded-xl text-sm font-semibold capitalize",
                option === quantityMode ? "bg-white text-ink shadow-sm" : "text-stone-500",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
        {quantityMode === "percentage" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {PERCENTAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPercentage(option.value)}
                className={[
                  "tap-target rounded-full px-4 text-sm font-semibold",
                  option.value === percentage
                    ? "bg-moss text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-[1fr_1.3fr] gap-2">
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            />
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value as Unit)}
              className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-soft">
        <p className="text-sm font-semibold text-stone-700">Status actions</p>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={() => void markItemConsumed(item.id).then(() => navigate("/inventory"))}
            className="tap-target rounded-2xl bg-sage px-4 text-sm font-semibold text-moss"
          >
            Consumed
          </button>
          <button
            type="button"
            onClick={() => void markItemDiscarded(item.id).then(() => navigate("/inventory"))}
            className="tap-target rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700"
          >
            Discarded
          </button>
          {item.expiryStatus === "expired" ? (
            <button
              type="button"
              onClick={() => void keepItemForNow(item.id).then(() => navigate("/inventory"))}
              className="tap-target rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
            >
              Keep for now
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void extendItemExpiry(item.id, customExpiryDate)}
            className="tap-target rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
          >
            Extend to selected date
          </button>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="sticky bottom-24 grid gap-2 rounded-[1.25rem] bg-cream/90 py-2 backdrop-blur">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-red-700 ring-1 ring-red-100 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete item
        </button>
      </div>
    </form>
  );
}
